package ch.celestin.gyoza.order.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateOrderItemRequest(

        @NotNull
        Long packId,

        @Positive
        int quantity
) {
}