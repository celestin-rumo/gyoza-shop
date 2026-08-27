package ch.celestin.gyoza.rawmaterial.dto;

import ch.celestin.gyoza.rawmaterial.PurchaseSource;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RawMaterialPurchaseResponse(
        Long id,
        Long rawMaterialId,
        String rawMaterialName,
        LocalDate date,
        BigDecimal quantityPurchased,
        BigDecimal totalPricePaid,
        BigDecimal unitPrice,
        PurchaseSource source,
        String originCountry,
        String store,
        String batchNumber
) {
}
