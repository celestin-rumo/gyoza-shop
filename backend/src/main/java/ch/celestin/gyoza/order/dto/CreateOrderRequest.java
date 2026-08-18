package ch.celestin.gyoza.order.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(

        @Valid
        @NotNull
        CreateOrderCustomerRequest customer,

        @Valid
        @NotEmpty
        List<CreateOrderItemRequest> lines
) {
}