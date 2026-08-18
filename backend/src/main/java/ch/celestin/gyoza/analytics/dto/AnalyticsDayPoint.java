package ch.celestin.gyoza.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;

public record AnalyticsDayPoint(
        LocalDate date,
        BigDecimal revenue,
        long orderCount,
        long newCustomerCount,
        Map<String, Integer> unitsByProduct
) {
}
