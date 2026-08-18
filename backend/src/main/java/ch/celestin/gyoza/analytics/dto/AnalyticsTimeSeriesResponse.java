package ch.celestin.gyoza.analytics.dto;

import java.util.List;

public record AnalyticsTimeSeriesResponse(
        List<AnalyticsDayPoint> days
) {
}
