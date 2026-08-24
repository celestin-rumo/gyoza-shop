package ch.celestin.gyoza.slot.dto;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;

import java.time.LocalDate;
import java.time.LocalTime;

public record SlotAvailabilityResponse(
        Long id,
        LocalDate date,
        FulfillmentMethod fulfillmentMethod,
        LocalTime startTime,
        LocalTime endTime,
        ContentType contentType,
        boolean open
) {
}
