package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.order.OrderItem;
import ch.celestin.gyoza.product.Product;

public interface ProductOutputAllocationService {

    /**
     * Attributes `quantity` gyoza consumed by `orderItem` to the product's production batches,
     * oldest first. Any shortfall (stock not traceable to a batch — manual admin additions,
     * initial product stock) is recorded as unattributed. Does not itself validate that enough
     * total stock exists — the caller (OrderServiceImpl) already does that via
     * Product.removeStock before calling this.
     */
    void allocate(Product product, int quantity, OrderItem orderItem);
}
