package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateProductOutputRequest(

        @NotNull
        Long productId,

        @Positive
        int quantityProduced

) {
}
