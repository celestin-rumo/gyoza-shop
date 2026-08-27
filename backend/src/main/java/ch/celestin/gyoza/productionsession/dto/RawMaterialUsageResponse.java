package ch.celestin.gyoza.productionsession.dto;

import java.math.BigDecimal;

public record RawMaterialUsageResponse(
        Long rawMaterialId,
        String rawMaterialName,
        String unit,
        BigDecimal quantityUsed,
        BigDecimal unitCost,
        BigDecimal lineCost,
        Long targetProductId,
        String targetProductName
) {
}
