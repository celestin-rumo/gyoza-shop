package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.exception.ProductionSessionNotFoundException;
import ch.celestin.gyoza.exception.RawMaterialNotFoundException;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.productionsession.dto.*;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.rawmaterial.RawMaterialRepository;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ProductionSessionServiceImpl
        implements ProductionSessionService {

    private final ProductionSessionRepository productionSessionRepository;
    private final RawMaterialRepository rawMaterialRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ProductionSessionServiceImpl(
            ProductionSessionRepository productionSessionRepository,
            RawMaterialRepository rawMaterialRepository,
            ProductRepository productRepository,
            UserRepository userRepository
    ) {
        this.productionSessionRepository = productionSessionRepository;
        this.rawMaterialRepository = rawMaterialRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public ProductionSessionResponse createSession(CreateProductionSessionRequest request) {

        String batchNumber = generateBatchNumber(request.date());
        ProductionSession session = new ProductionSession(
                request.date(), batchNumber, request.durationHours(), request.notes()
        );

        for (CreateRawMaterialUsageRequest line : request.rawMaterialUsages()) {

            RawMaterial rawMaterial = rawMaterialRepository
                    .findById(line.rawMaterialId())
                    .orElseThrow(() -> new RawMaterialNotFoundException(line.rawMaterialId()));

            session.addRawMaterialUsage(new RawMaterialUsage(rawMaterial, line.quantityUsed()));
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

            session.addOutput(new ProductOutput(product, line.quantityProduced()));
        }

        ProductionSession saved = productionSessionRepository.save(session);

        return toResponse(saved);
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
                session.getRawMaterialUsages().stream().map(this::toUsageResponse).toList(),
                session.getParticipants().stream().map(this::toParticipantResponse).toList(),
                session.getOutputs().stream().map(this::toOutputResponse).toList()
        );
    }

    private RawMaterialUsageResponse toUsageResponse(RawMaterialUsage usage) {
        return new RawMaterialUsageResponse(
                usage.getRawMaterial().getId(),
                usage.getRawMaterial().getName(),
                usage.getRawMaterial().getUnit(),
                usage.getQuantityUsed()
        );
    }

    private SessionParticipantResponse toParticipantResponse(SessionParticipant participant) {
        return new SessionParticipantResponse(
                participant.getUser().getId(),
                participant.getUser().getFirstName() + " " + participant.getUser().getLastName()
        );
    }

    private ProductOutputResponse toOutputResponse(ProductOutput output) {
        return new ProductOutputResponse(
                output.getProduct().getId(),
                output.getProduct().getName(),
                output.getQuantityProduced()
        );
    }
}
