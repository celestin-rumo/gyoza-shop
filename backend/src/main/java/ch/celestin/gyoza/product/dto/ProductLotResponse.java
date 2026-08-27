package ch.celestin.gyoza.product.dto;

import java.time.LocalDate;

public record ProductLotResponse(
        Long productOutputId,
        String batchNumber,
        LocalDate date,
        int remainingQuantity
) {
}
