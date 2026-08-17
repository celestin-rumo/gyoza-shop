package ch.celestin.gyoza.product;

import ch.celestin.gyoza.product.dto.CreateProductRequest;
import ch.celestin.gyoza.product.dto.ProductResponse;
import ch.celestin.gyoza.product.dto.StockQuantityRequest;
import ch.celestin.gyoza.product.dto.UpdateProductStatusRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class AdminProductController {

    private final ProductService productService;

    public AdminProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @PostMapping
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request) {
        return productService.createProduct(request);
    }

    @PostMapping("/{productId}/stock")
    public ProductResponse addStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockQuantityRequest request
    ) {
        return productService.addStock(productId, request.quantity());
    }

    @PostMapping("/{productId}/stock/remove")
    public ProductResponse removeStock(
            @PathVariable Long productId,
            @Valid @RequestBody StockQuantityRequest request
    ) {
        return productService.removeStock(productId, request.quantity());
    }

    @PatchMapping("/{productId}/status")
    public ProductResponse setStatus(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductStatusRequest request
    ) {
        return productService.setActive(productId, request.active());
    }
}
