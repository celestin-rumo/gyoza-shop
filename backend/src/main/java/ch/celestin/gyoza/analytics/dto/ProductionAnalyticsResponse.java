package ch.celestin.gyoza.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record ProductionAnalyticsResponse(
        BigDecimal totalMaterialCost,
        BigDecimal totalNetProfit,
        BigDecimal averageMaterialCostPerGyoza,
        Map<String, BigDecimal> averageCostPerGyozaByFlavor,
        // "Réel" totals — only counts orders that reached DELIVERED, unlike the théorique
        // totals above which are frozen catalog-based estimates. See
        // ProductionSessionCostCalculator.actualSummary.
        BigDecimal totalActualRevenue,
        BigDecimal totalActualNetProfit,
        List<SessionCostPoint> sessions
) {

    public record SessionCostPoint(
            LocalDate date,
            String batchNumber,
            BigDecimal materialCost,
            BigDecimal netProfit,
            BigDecimal actualNetProfit
    ) {
    }
}
