package ch.celestin.gyoza.productionsession.dto;

import java.math.BigDecimal;

public record ProductionSessionCostSummary(
        BigDecimal totalMaterialCost,
        int totalGyozaProduced,
        BigDecimal materialCostPerGyoza,
        BigDecimal totalSessionHours,
        BigDecimal timePerGyoza,
        BigDecimal theoreticalRevenue,
        BigDecimal grossProfit,
        BigDecimal otherCosts,
        BigDecimal netProfit,
        BigDecimal hourlyRevenue,
        BigDecimal roi
) {
}
