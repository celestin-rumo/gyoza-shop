package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.exception.RawMaterialNotFoundException;
import ch.celestin.gyoza.rawmaterial.dto.CreateRawMaterialRequest;
import ch.celestin.gyoza.rawmaterial.dto.RawMaterialResponse;
import ch.celestin.gyoza.rawmaterial.dto.UpdateRawMaterialRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class RawMaterialServiceImpl
        implements RawMaterialService {

    private final RawMaterialRepository rawMaterialRepository;
    private final RawMaterialPurchaseRepository rawMaterialPurchaseRepository;

    public RawMaterialServiceImpl(
            RawMaterialRepository rawMaterialRepository,
            RawMaterialPurchaseRepository rawMaterialPurchaseRepository
    ) {
        this.rawMaterialRepository = rawMaterialRepository;
        this.rawMaterialPurchaseRepository = rawMaterialPurchaseRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RawMaterialResponse> getAllRawMaterials() {

        return rawMaterialRepository
                .findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public RawMaterialResponse createRawMaterial(CreateRawMaterialRequest request) {

        if (rawMaterialRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException(
                    "Une matière première avec ce nom existe déjà"
            );
        }

        RawMaterial rawMaterial = rawMaterialRepository.save(
                new RawMaterial(request.name(), request.unit())
        );

        return toResponse(rawMaterial);
    }

    @Override
    @Transactional
    public RawMaterialResponse updateRawMaterial(Long rawMaterialId, UpdateRawMaterialRequest request) {

        RawMaterial rawMaterial = findRawMaterialOrThrow(rawMaterialId);

        if (rawMaterialRepository.existsByNameIgnoreCaseAndIdNot(request.name(), rawMaterialId)) {
            throw new IllegalArgumentException(
                    "Une matière première avec ce nom existe déjà"
            );
        }

        rawMaterial.rename(request.name());
        rawMaterial.changeUnit(request.unit());

        return toResponse(rawMaterial);
    }

    @Override
    @Transactional
    public void deleteRawMaterial(Long rawMaterialId) {

        RawMaterial rawMaterial = findRawMaterialOrThrow(rawMaterialId);

        if (rawMaterialPurchaseRepository.existsByRawMaterialId(rawMaterial.getId())) {
            throw new IllegalArgumentException(
                    "Impossible de supprimer une matière première ayant des achats enregistrés"
            );
        }

        rawMaterialRepository.delete(rawMaterial);
    }

    private RawMaterial findRawMaterialOrThrow(Long rawMaterialId) {
        return rawMaterialRepository
                .findById(rawMaterialId)
                .orElseThrow(() -> new RawMaterialNotFoundException(rawMaterialId));
    }

    private RawMaterialResponse toResponse(RawMaterial rawMaterial) {

        return rawMaterialPurchaseRepository
                .findFirstByRawMaterialIdOrderByDateDescIdDesc(rawMaterial.getId())
                .map(purchase -> new RawMaterialResponse(
                        rawMaterial.getId(),
                        rawMaterial.getName(),
                        rawMaterial.getUnit(),
                        purchase.getUnitPrice(),
                        purchase.getDate()
                ))
                .orElseGet(() -> new RawMaterialResponse(
                        rawMaterial.getId(),
                        rawMaterial.getName(),
                        rawMaterial.getUnit(),
                        null,
                        null
                ));
    }
}
