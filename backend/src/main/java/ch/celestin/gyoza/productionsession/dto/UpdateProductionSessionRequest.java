package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full session edit — everything except {@code date} (fixed after creation: it drives the
 * batch number, which is never regenerated).
 */
public record UpdateProductionSessionRequest(

        @NotNull
        @Positive
        BigDecimal durationHours,

        String notes,

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
