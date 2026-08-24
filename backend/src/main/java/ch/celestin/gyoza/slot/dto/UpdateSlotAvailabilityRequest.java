package ch.celestin.gyoza.slot.dto;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalTime;

public record UpdateSlotAvailabilityRequest(

        @NotNull
        LocalDate date,

        @NotNull
        FulfillmentMethod fulfillmentMethod,

        @NotNull
        LocalTime startTime,

        @NotNull
        LocalTime endTime,

        @NotNull
        ContentType contentType
) {
}
