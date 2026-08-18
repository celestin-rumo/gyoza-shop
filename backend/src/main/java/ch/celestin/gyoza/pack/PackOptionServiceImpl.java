package ch.celestin.gyoza.pack;

import ch.celestin.gyoza.exception.PackNotFoundException;
import ch.celestin.gyoza.pack.dto.CreatePackRequest;
import ch.celestin.gyoza.pack.dto.PackResponse;
import ch.celestin.gyoza.pack.dto.UpdatePackRequest;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PackOptionServiceImpl implements PackOptionService {

    private final ProductRepository productRepository;
    private final PackOptionRepository packOptionRepository;

    public PackOptionServiceImpl(
            ProductRepository productRepository,
            PackOptionRepository packOptionRepository
    ) {
        this.productRepository = productRepository;
        this.packOptionRepository = packOptionRepository;
    }

    @Override
    @Transactional
    public PackResponse addPack(Long productId, CreatePackRequest request) {
        Product product = productRepository
                .findById(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Produit introuvable : " + productId
                ));

        PackOption pack = packOptionRepository.save(
                new PackOption(product, request.size(), request.price())
        );

        return toResponse(pack);
    }

    @Override
    @Transactional
    public PackResponse updatePack(Long packId, UpdatePackRequest request) {
        PackOption pack = packOptionRepository
                .findById(packId)
                .orElseThrow(() -> new PackNotFoundException(packId));

        pack.changeSize(request.size());
        pack.changePrice(request.price());

        return toResponse(pack);
    }

    @Override
    @Transactional
    public void deletePack(Long packId) {
        if (!packOptionRepository.existsById(packId)) {
            throw new PackNotFoundException(packId);
        }

        packOptionRepository.deleteById(packId);
    }

    private PackResponse toResponse(PackOption pack) {
        return new PackResponse(
                pack.getId(),
                pack.getSize(),
                pack.getPrice()
        );
    }
}
