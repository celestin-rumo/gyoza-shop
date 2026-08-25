package ch.celestin.gyoza.order.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderItemResponse(
        Long id,
        String productName,
        int packSize,
        int packQuantity,
        BigDecimal unitPackPrice,
        boolean batchValidated,
        List<OrderItemBatchResponse> batches
) {

    /** {@code batchNumber} is null when this quantity came from stock not traceable to any production session. */
    public record OrderItemBatchResponse(
            String batchNumber,
            int quantity
    ) {
    }
}
