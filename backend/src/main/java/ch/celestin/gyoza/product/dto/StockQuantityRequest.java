package ch.celestin.gyoza.product.dto;

import jakarta.validation.constraints.Positive;

public record StockQuantityRequest(

        @Positive
        int quantity

) {
}
