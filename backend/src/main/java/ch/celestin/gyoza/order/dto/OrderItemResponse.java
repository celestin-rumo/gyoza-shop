package ch.celestin.gyoza.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(
        String productName,
        int packSize,
        int packQuantity,
        BigDecimal unitPackPrice
) {
}
