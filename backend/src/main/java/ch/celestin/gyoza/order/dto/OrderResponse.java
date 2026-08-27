package ch.celestin.gyoza.order.dto;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import ch.celestin.gyoza.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public record OrderResponse(
        Long id,
        OrderStatus status,
        BigDecimal totalPrice,
        LocalDateTime createdAt,
        OrderCustomerResponse customer,
        List<OrderItemResponse> items,
        FulfillmentMethod fulfillmentMethod,
        LocalDate date,
        LocalTime startTime,
        LocalTime endTime,
        ContentType contentType
) {
}