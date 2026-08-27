package ch.celestin.gyoza.rawmaterial.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RawMaterialResponse(
        Long id,
        String name,
        String unit,
        BigDecimal referenceUnitPrice,
        LocalDate lastPurchaseDate
) {
}
