package ch.celestin.gyoza.order.dto;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateOrderRequest(

        @Valid
        @NotNull
        CreateOrderCustomerRequest customer,

        @Valid
        @NotEmpty
        List<CreateOrderItemRequest> lines,

        @NotNull
        FulfillmentMethod fulfillmentMethod,

        // Must be a valid PickupSlot or DeliverySlot name matching
        // fulfillmentMethod — checked in OrderServiceImpl.
        @NotBlank
        String slot,

        @NotNull
        ContentType contentType
) {
}