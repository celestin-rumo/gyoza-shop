package ch.celestin.gyoza.product.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;

public record CreateProductRequest(

        @NotBlank
        String name,

        @PositiveOrZero
        int initialStock

) {
}
