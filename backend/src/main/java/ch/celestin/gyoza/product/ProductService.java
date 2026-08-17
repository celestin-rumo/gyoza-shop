package ch.celestin.gyoza.product;

import ch.celestin.gyoza.product.dto.CreateProductRequest;
import ch.celestin.gyoza.product.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    List<ProductResponse> getActiveProducts();

    List<ProductResponse> getAllProducts();

    ProductResponse createProduct(CreateProductRequest request);

    ProductResponse addStock(Long productId, int quantity);

    ProductResponse removeStock(Long productId, int quantity);

    ProductResponse setActive(Long productId, boolean active);
}
