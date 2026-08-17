package ch.celestin.gyoza.product;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.pack.dto.PackResponse;
import ch.celestin.gyoza.product.dto.ProductResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductServiceImpl
        implements ProductService {

    private final ProductRepository productRepository;
    private final PackOptionRepository packOptionRepository;

    public ProductServiceImpl(
            ProductRepository productRepository,
            PackOptionRepository packOptionRepository
    ) {
        this.productRepository = productRepository;
        this.packOptionRepository = packOptionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {

        return productRepository
                .findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private ProductResponse toResponse(Product product) {

        List<PackResponse> packs =
                packOptionRepository
                        .findByProductId(product.getId())
                        .stream()
                        .map(this::toPackResponse)
                        .toList();

        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getStockQuantity(),
                product.isActive(),
                packs
        );
    }

    private PackResponse toPackResponse(
            PackOption pack
    ) {
        return new PackResponse(
                pack.getId(),
                pack.getSize(),
                pack.getPrice()
        );
    }
}