package ch.celestin.gyoza.order.dto;

import ch.celestin.gyoza.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(

        @NotNull
        OrderStatus status
) {
}