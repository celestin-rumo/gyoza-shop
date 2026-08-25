package ch.celestin.gyoza.productionsession.dto;

import java.math.BigDecimal;

public record ProductionSessionActualSummary(
        int unitsSold,
        int unitsRemaining,
        BigDecimal actualRevenue,
        BigDecimal actualGrossProfit,
        BigDecimal actualNetProfit,
        BigDecimal actualHourlyRevenue,
        BigDecimal actualRoi
) {
}
