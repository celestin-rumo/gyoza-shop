package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record CreateRawMaterialUsageRequest(

        @NotNull
        Long rawMaterialId,

        @NotNull
        @Positive
        BigDecimal quantityUsed

) {
}
