package ch.celestin.gyoza.pack.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdatePackPriceRequest(

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal price

) {
}