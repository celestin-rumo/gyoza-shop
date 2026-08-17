package ch.celestin.gyoza.product;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.pack.dto.PackResponse;
import ch.celestin.gyoza.product.dto.CreateProductRequest;
import ch.celestin.gyoza.product.dto.ProductResponse;
import jakarta.persistence.EntityNotFoundException;
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
    public List<ProductResponse> getActiveProducts() {

        return productRepository
                .findByActiveTrue()
                .stream()
                .map(this::toResponse)
                .toList();
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

    @Override
    @Transactional
    public ProductResponse createProduct(CreateProductRequest request) {

        if (productRepository.existsByNameIgnoreCase(request.name())) {
            throw new IllegalArgumentException(
                    "Un produit avec ce nom existe déjà"
            );
        }

        Product product = productRepository.save(
                new Product(request.name(), request.initialStock())
        );

        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse addStock(Long productId, int quantity) {
        Product product = findProductOrThrow(productId);
        product.addStock(quantity);

        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse removeStock(Long productId, int quantity) {
        Product product = findProductOrThrow(productId);
        product.removeStock(quantity);

        return toResponse(product);
    }

    @Override
    @Transactional
    public ProductResponse setActive(Long productId, boolean active) {
        Product product = findProductOrThrow(productId);

        if (active) {
            product.activate();
        } else {
            product.deactivate();
        }

        return toResponse(product);
    }

    private Product findProductOrThrow(Long productId) {
        return productRepository
                .findById(productId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Produit introuvable : " + productId
                ));
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
