package ch.celestin.gyoza.freshavailability.dto;

import java.time.LocalDate;

public record FreshAvailabilityResponse(
        LocalDate nextBatchDate,
        boolean orderWindowOpen
) {
}
