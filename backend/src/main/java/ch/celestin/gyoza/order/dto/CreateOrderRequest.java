package ch.celestin.gyoza.order.dto;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;
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

        // The date of an open SlotAvailability instance matching
        // fulfillmentMethod + startTime + endTime — checked in OrderServiceImpl.
        @NotNull
        LocalDate date,

        @NotNull
        LocalTime startTime,

        @NotNull
        LocalTime endTime,

        @NotNull
        ContentType contentType
) {
}