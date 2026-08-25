package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.order.OrderItem;
import ch.celestin.gyoza.product.Product;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductOutputAllocationServiceImpl implements ProductOutputAllocationService {

    private final ProductOutputRepository productOutputRepository;

    public ProductOutputAllocationServiceImpl(ProductOutputRepository productOutputRepository) {
        this.productOutputRepository = productOutputRepository;
    }

    @Override
    public void allocate(Product product, int quantity, OrderItem orderItem) {
        List<ProductOutput> batches = productOutputRepository
                .findByProduct_IdAndRemainingQuantityGreaterThanOrderByProductionSession_DateAscIdAsc(
                        product.getId(), 0
                );

        int stillNeeded = quantity;

        for (ProductOutput batch : batches) {
            if (stillNeeded <= 0) {
                break;
            }

            int taken = Math.min(batch.getRemainingQuantity(), stillNeeded);
            batch.consume(taken);

            ProductOutputAllocation allocation = new ProductOutputAllocation(batch, taken);
            batch.addAllocation(allocation);
            orderItem.addAllocation(allocation);

            stillNeeded -= taken;
        }

        // Stock not traceable to any batch (manual admin additions, initial product stock) —
        // expected, not an error; excluded from session-level "actual revenue" by design.
        if (stillNeeded > 0) {
            orderItem.addAllocation(new ProductOutputAllocation(null, stillNeeded));
        }
    }
}
