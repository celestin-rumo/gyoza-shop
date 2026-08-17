package ch.celestin.gyoza.pack.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record UpdatePackRequest(

        @Positive
        int size,

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal price

) {
}
