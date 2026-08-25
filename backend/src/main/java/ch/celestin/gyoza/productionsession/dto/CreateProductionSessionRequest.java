package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

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
