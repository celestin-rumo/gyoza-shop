package ch.celestin.gyoza.freshavailability.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record UpdateFreshAvailabilityRequest(

        @NotNull
        LocalDate nextBatchDate,

        boolean orderWindowOpen
) {
}
