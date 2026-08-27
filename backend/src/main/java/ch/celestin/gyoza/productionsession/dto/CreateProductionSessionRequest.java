package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateProductionSessionRequest(

        @NotNull
        LocalDate date,

        @NotNull
        @Positive
        BigDecimal durationHours,

        String notes,

        // Free-form additional costs (packaging, transport, ...); defaults to 0 when absent.
        @PositiveOrZero
        BigDecimal otherCosts,

        @Valid
        @NotEmpty
        List<CreateRawMaterialUsageRequest> rawMaterialUsages,

        @Valid
        @NotEmpty
        List<CreateSessionParticipantRequest> participants,

        @Valid
        @NotEmpty
        List<CreateProductOutputRequest> outputs

) {
}
