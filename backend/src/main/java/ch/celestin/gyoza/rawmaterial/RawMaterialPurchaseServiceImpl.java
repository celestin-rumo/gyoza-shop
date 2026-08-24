package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.exception.RawMaterialNotFoundException;
import ch.celestin.gyoza.rawmaterial.dto.CreateRawMaterialPurchaseRequest;
import ch.celestin.gyoza.rawmaterial.dto.RawMaterialPurchaseResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RawMaterialPurchaseServiceImpl
        implements RawMaterialPurchaseService {

    private final RawMaterialRepository rawMaterialRepository;
    private final RawMaterialPurchaseRepository rawMaterialPurchaseRepository;

    public RawMaterialPurchaseServiceImpl(
            RawMaterialRepository rawMaterialRepository,
            RawMaterialPurchaseRepository rawMaterialPurchaseRepository
    ) {
        this.rawMaterialRepository = rawMaterialRepository;
        this.rawMaterialPurchaseRepository = rawMaterialPurchaseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RawMaterialPurchaseResponse> getPurchases(Long rawMaterialId) {

        List<RawMaterialPurchase> purchases = rawMaterialId != null
                ? rawMaterialPurchaseRepository.findByRawMaterialIdOrderByDateDescIdDesc(rawMaterialId)
                : rawMaterialPurchaseRepository.findAllByOrderByDateDescIdDesc();

        return purchases
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RawMaterialPurchaseResponse createPurchase(CreateRawMaterialPurchaseRequest request) {

        RawMaterial rawMaterial = rawMaterialRepository
                .findById(request.rawMaterialId())
                .orElseThrow(() -> new RawMaterialNotFoundException(request.rawMaterialId()));

        RawMaterialPurchase purchase = rawMaterialPurchaseRepository.save(
                new RawMaterialPurchase(
                        rawMaterial,
                        request.date(),
                        request.quantityPurchased(),
                        request.totalPricePaid(),
                        request.source(),
                        request.originCountry(),
                        request.store(),
                        request.batchNumber()
                )
        );

        return toResponse(purchase);
    }

    private RawMaterialPurchaseResponse toResponse(RawMaterialPurchase purchase) {
        return new RawMaterialPurchaseResponse(
                purchase.getId(),
                purchase.getRawMaterial().getId(),
                purchase.getRawMaterial().getName(),
                purchase.getDate(),
                purchase.getQuantityPurchased(),
                purchase.getTotalPricePaid(),
                purchase.getUnitPrice(),
                purchase.getSource(),
                purchase.getOriginCountry(),
                purchase.getStore(),
                purchase.getBatchNumber()
        );
    }
}
