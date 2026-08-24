package ch.celestin.gyoza.slot.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MoveSlotRequest(

        @NotNull
        LocalDate date
) {
}
