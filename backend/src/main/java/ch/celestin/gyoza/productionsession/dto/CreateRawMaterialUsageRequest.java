package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateRawMaterialUsageRequest(

        @NotNull
        Long rawMaterialId,

        @NotNull
        @Positive
        BigDecimal quantityUsed,

        // Which flavor this usage line is for; null means it's a shared ingredient whose
        // cost gets prorated across every output of the session.
        Long targetProductId

) {
}
