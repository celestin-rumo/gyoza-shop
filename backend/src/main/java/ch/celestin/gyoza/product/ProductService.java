package ch.celestin.gyoza.product;

import ch.celestin.gyoza.product.dto.CreateProductRequest;
import ch.celestin.gyoza.product.dto.ProductLotResponse;
import ch.celestin.gyoza.product.dto.ProductResponse;

import java.util.List;

public interface ProductService {

    List<ProductResponse> getActiveProducts();

    List<ProductResponse> getAllProducts();

    ProductResponse createProduct(CreateProductRequest request);

    ProductResponse addStock(Long productId, int quantity);

    ProductResponse setActive(Long productId, boolean active);

    /** Production-session batches with stock still remaining, oldest first — see ProductOutput. */
    List<ProductLotResponse> getAvailableLots(Long productId);

    /**
     * Removes stock lost from a specific batch (perte/casse/correction), shrinking that batch's
     * produced quantity so the production session's cost-per-unit recalculates accordingly —
     * see ProductOutput.changeQuantityProduced.
     */
    ProductResponse removeStockFromLot(Long productId, Long productOutputId, int quantity);
}
