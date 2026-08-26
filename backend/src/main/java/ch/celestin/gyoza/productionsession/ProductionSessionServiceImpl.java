package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.exception.ProductionSessionNotFoundException;
import ch.celestin.gyoza.exception.RawMaterialNotFoundException;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.productionsession.dto.*;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.rawmaterial.RawMaterialPurchase;
import ch.celestin.gyoza.rawmaterial.RawMaterialPurchaseRepository;
import ch.celestin.gyoza.rawmaterial.RawMaterialRepository;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ProductionSessionServiceImpl
        implements ProductionSessionService {

    private final ProductionSessionRepository productionSessionRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final RawMaterialPurchaseRepository rawMaterialPurchaseRepository;
    private final ProductRepository productRepository;
    private final PackOptionRepository packOptionRepository;
    private final UserRepository userRepository;

    public ProductionSessionServiceImpl(
            ProductionSessionRepository productionSessionRepository,
            RawMaterialRepository rawMaterialRepository,
            RawMaterialPurchaseRepository rawMaterialPurchaseRepository,
            ProductRepository productRepository,
            PackOptionRepository packOptionRepository,
            UserRepository userRepository
    ) {
        this.productionSessionRepository = productionSessionRepository;
        this.rawMaterialRepository = rawMaterialRepository;
        this.rawMaterialPurchaseRepository = rawMaterialPurchaseRepository;
        this.productRepository = productRepository;
        this.packOptionRepository = packOptionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ProductionSessionResponse createSession(CreateProductionSessionRequest request) {

        String batchNumber = generateBatchNumber(request.date());
        ProductionSession session = new ProductionSession(
                request.date(), batchNumber, request.durationHours(), request.notes(), request.otherCosts()
        );

        for (CreateRawMaterialUsageRequest line : request.rawMaterialUsages()) {

            RawMaterial rawMaterial = rawMaterialRepository
                    .findById(line.rawMaterialId())
                    .orElseThrow(() -> new RawMaterialNotFoundException(line.rawMaterialId()));

            Product targetProduct = line.targetProductId() != null
                    ? productRepository.findById(line.targetProductId())
                            .orElseThrow(() -> new EntityNotFoundException(
                                    "Produit introuvable : " + line.targetProductId()
                            ))
                    : null;

            BigDecimal unitCost = lastKnownUnitCost(rawMaterial.getId());

            session.addRawMaterialUsage(
                    new RawMaterialUsage(rawMaterial, line.quantityUsed(), unitCost, targetProduct)
            );
        }

        for (CreateSessionParticipantRequest line : request.participants()) {

            User user = userRepository
                    .findById(line.userId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Utilisateur introuvable : " + line.userId()
                    ));

            session.addParticipant(new SessionParticipant(user));
        }

        for (CreateProductOutputRequest line : request.outputs()) {

            Product product = productRepository
                    .findById(line.productId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Produit introuvable : " + line.productId()
                    ));

            // Reuses Product's own stock-mutation logic (validation, invariants) instead
            // of duplicating it here — see Product.addStock.
            product.addStock(line.quantityProduced());

            BigDecimal unitSalePrice = averageUnitSalePrice(product);

            session.addOutput(new ProductOutput(product, line.quantityProduced(), unitSalePrice));
        }

        ProductionSession saved = productionSessionRepository.save(session);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public ProductionSessionResponse updateOtherCosts(Long sessionId, BigDecimal otherCosts) {

        ProductionSession session = productionSessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ProductionSessionNotFoundException(sessionId));

        session.changeOtherCosts(otherCosts);

        return toResponse(session);
    }

    @Override
    @Transactional
    public ProductionSessionResponse updateDetails(Long sessionId, UpdateProductionSessionDetailsRequest request) {

        ProductionSession session = productionSessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ProductionSessionNotFoundException(sessionId));

        session.changeDetails(request.notes(), request.durationHours());

        return toResponse(session);
    }

    private BigDecimal lastKnownUnitCost(Long rawMaterialId) {
        return rawMaterialPurchaseRepository
                .findFirstByRawMaterialIdOrderByDateDescIdDesc(rawMaterialId)
                .map(RawMaterialPurchase::getUnitPrice)
                .orElse(BigDecimal.ZERO);
    }

    /**
     * Average sale price per unit across a product's packs (price / size), gated on the
     * product being active — an inactive product's packs contribute no price data.
     */
    private BigDecimal averageUnitSalePrice(Product product) {
        if (!product.isActive()) {
            return BigDecimal.ZERO;
        }

        List<PackOption> packs = packOptionRepository.findByProductId(product.getId());
        if (packs.isEmpty()) {
            return BigDecimal.ZERO;
        }

        BigDecimal sum = packs.stream()
                .map(pack -> pack.getPrice().divide(BigDecimal.valueOf(pack.getSize()), 4, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return sum.divide(BigDecimal.valueOf(packs.size()), 4, RoundingMode.HALF_UP);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductionSessionResponse> getAllSessions() {

        return productionSessionRepository
                .findAllByOrderByDateDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProductionSessionResponse getSession(Long sessionId) {

        ProductionSession session = productionSessionRepository
                .findById(sessionId)
                .orElseThrow(() -> new ProductionSessionNotFoundException(sessionId));

        return toResponse(session);
    }

    /**
     * Lot/batch traceability code, food-industry style: date + sequence number within that
     * day (e.g. "L20260825-01", then "L20260825-02" for a second session the same day).
     */
    private String generateBatchNumber(LocalDate date) {
        long sessionsThatDay = productionSessionRepository.countByDate(date);

        return "L%s-%02d".formatted(
                date.format(DateTimeFormatter.BASIC_ISO_DATE),
                sessionsThatDay + 1
        );
    }

    private ProductionSessionResponse toResponse(ProductionSession session) {
        return new ProductionSessionResponse(
                session.getId(),
                session.getDate(),
                session.getBatchNumber(),
                session.getDurationHours(),
                session.getNotes(),
                session.getOtherCosts(),
                session.getRawMaterialUsages().stream().map(this::toUsageResponse).toList(),
                session.getParticipants().stream().map(this::toParticipantResponse).toList(),
                session.getOutputs().stream().map(output -> toOutputResponse(session, output)).toList(),
                toCostSummary(session),
                toActualSummary(session)
        );
    }

    private RawMaterialUsageResponse toUsageResponse(RawMaterialUsage usage) {
        Product targetProduct = usage.getTargetProduct();

        return new RawMaterialUsageResponse(
                usage.getRawMaterial().getId(),
                usage.getRawMaterial().getName(),
                usage.getRawMaterial().getUnit(),
                usage.getQuantityUsed(),
                usage.getUnitCost(),
                usage.getUnitCost().multiply(usage.getQuantityUsed()),
                targetProduct != null ? targetProduct.getId() : null,
                targetProduct != null ? targetProduct.getName() : null
        );
    }

    private SessionParticipantResponse toParticipantResponse(SessionParticipant participant) {
        return new SessionParticipantResponse(
                participant.getUser().getId(),
                participant.getUser().getFirstName() + " " + participant.getUser().getLastName()
        );
    }

    private ProductOutputResponse toOutputResponse(ProductionSession session, ProductOutput output) {
        return new ProductOutputResponse(
                output.getProduct().getId(),
                output.getProduct().getName(),
                output.getQuantityProduced(),
                output.getUnitSalePrice(),
                ProductionSessionCostCalculator.revenueForOutput(output),
                ProductionSessionCostCalculator.materialCostForOutput(session, output),
                ProductionSessionCostCalculator.costPerGyozaForOutput(session, output),
                ProductionSessionCostCalculator.unitsSoldForOutput(output),
                output.getRemainingQuantity(),
                ProductionSessionCostCalculator.actualRevenueForOutput(output)
        );
    }

    private ProductionSessionActualSummary toActualSummary(ProductionSession session) {
        ProductionSessionCostCalculator.ActualSummary summary =
                ProductionSessionCostCalculator.actualSummary(session);

        return new ProductionSessionActualSummary(
                summary.unitsSold(),
                summary.unitsRemaining(),
                summary.actualRevenue(),
                summary.actualGrossProfit(),
                summary.actualNetProfit(),
                summary.actualHourlyRevenue(),
                summary.actualRoi()
        );
    }

    private ProductionSessionCostSummary toCostSummary(ProductionSession session) {
        ProductionSessionCostCalculator.Summary summary = ProductionSessionCostCalculator.summary(session);

        return new ProductionSessionCostSummary(
                summary.totalMaterialCost(),
                summary.totalGyozaProduced(),
                summary.materialCostPerGyoza(),
                summary.totalSessionHours(),
                summary.timePerGyoza(),
                summary.theoreticalRevenue(),
                summary.grossProfit(),
                summary.otherCosts(),
                summary.netProfit(),
                summary.hourlyRevenue(),
                summary.roi()
        );
    }
}
