package ch.celestin.gyoza.rawmaterial.dto;

import ch.celestin.gyoza.rawmaterial.PurchaseSource;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateRawMaterialPurchaseRequest(

        @NotNull
        Long rawMaterialId,

        @NotNull
        LocalDate date,

        @NotNull
        @Positive
        BigDecimal quantityPurchased,

        @NotNull
        @DecimalMin(value = "0.01")
        BigDecimal totalPricePaid,

        @NotNull
        PurchaseSource source,

        @NotBlank
        String originCountry,

        @NotBlank
        String store,

        String batchNumber

) {
}
