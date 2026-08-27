package ch.celestin.gyoza.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProductionPeriodAnalyticsResponse(
        LocalDate startDate,
        LocalDate endDate,
        BigDecimal averageHourlyRevenue,
        // vs. the immediately preceding period of equal length; null when that period has no
        // sessions (nothing to compare against).
        BigDecimal averageHourlyRevenueChangePercent,
        BigDecimal averageMaterialCostPerGyoza,
        BigDecimal averageMaterialCostPerGyozaChangePercent,
        BigDecimal totalGrossProfit,
        BigDecimal totalNetProfit,
        List<SessionPeriodPoint> sessions,
        List<ParticipantHours> participantHours,
        BigDecimal totalMaterialCost,
        List<RawMaterialCostPoint> rawMaterialCosts
) {

    public record SessionPeriodPoint(
            LocalDate date,
            String batchNumber,
            BigDecimal hourlyRevenue,
            BigDecimal materialCostPerGyoza,
            BigDecimal grossProfit,
            BigDecimal netProfit
    ) {
    }

    public record ParticipantHours(
            String participantName,
            BigDecimal hours
    ) {
    }

    /** Raw material cost summed across every session in the period, regardless of which flavor it went to. */
    public record RawMaterialCostPoint(
            String rawMaterialName,
            BigDecimal totalCost
    ) {
    }
}
