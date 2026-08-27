package ch.celestin.gyoza.productionsession.dto;

import java.math.BigDecimal;

public record ProductOutputResponse(
        Long productId,
        String productName,
        int quantityProduced,
        BigDecimal unitSalePrice,
        BigDecimal revenue,
        BigDecimal materialCost,
        BigDecimal costPerGyoza,
        int unitsSold,
        int unitsRemaining,
        BigDecimal actualRevenue
) {
}
