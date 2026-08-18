package ch.celestin.gyoza.order.dto;

import ch.celestin.gyoza.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal totalPrice,
        LocalDateTime createdAt,
        OrderCustomerResponse customer,
        List<OrderItemResponse> items
) {
}