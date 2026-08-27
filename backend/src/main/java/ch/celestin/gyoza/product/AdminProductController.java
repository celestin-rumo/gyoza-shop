package ch.celestin.gyoza.product;

import ch.celestin.gyoza.product.dto.CreateProductRequest;
import ch.celestin.gyoza.product.dto.ProductLotResponse;
import ch.celestin.gyoza.product.dto.ProductResponse;
import ch.celestin.gyoza.product.dto.RemoveStockFromLotRequest;
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

    @GetMapping("/{productId}/lots")
    public List<ProductLotResponse> getLots(@PathVariable Long productId) {
        return productService.getAvailableLots(productId);
    }

    @PostMapping("/{productId}/stock/remove-from-lot")
    public ProductResponse removeStockFromLot(
            @PathVariable Long productId,
            @Valid @RequestBody RemoveStockFromLotRequest request
    ) {
        return productService.removeStockFromLot(productId, request.productOutputId(), request.quantity());
    }

    @PatchMapping("/{productId}/status")
    public ProductResponse setStatus(
            @PathVariable Long productId,
            @Valid @RequestBody UpdateProductStatusRequest request
    ) {
        return productService.setActive(productId, request.active());
    }
}
