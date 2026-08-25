package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateSessionParticipantRequest(

        @NotNull
        UUID userId,

        @NotNull
        @Positive
        BigDecimal hoursSpent

) {
}
