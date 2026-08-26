package ch.celestin.gyoza.product.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RemoveStockFromLotRequest(

        @NotNull
        Long productOutputId,

        @Positive
        int quantity

) {
}
