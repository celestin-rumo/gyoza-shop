package ch.celestin.gyoza.analytics.dto;

import ch.celestin.gyoza.order.OrderStatus;

import java.math.BigDecimal;
import java.util.Map;

public record AnalyticsResponse(
        long totalCustomers,
        long newCustomersLastWeek,
        long totalOrders,
        Map<OrderStatus, Long> ordersByStatus,
        BigDecimal averageOrderValue,
        BigDecimal revenueThisWeek,
        BigDecimal revenueThisMonth,
        BigDecimal revenueThisYear,
        BigDecimal totalRevenue
) {
}
