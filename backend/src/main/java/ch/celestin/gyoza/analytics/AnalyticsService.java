package ch.celestin.gyoza.analytics;

import ch.celestin.gyoza.analytics.dto.AnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.AnalyticsTimeSeriesResponse;
import ch.celestin.gyoza.analytics.dto.ProductionAnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse;

import java.time.LocalDate;

public interface AnalyticsService {

    AnalyticsResponse getAnalytics();

    AnalyticsTimeSeriesResponse getTimeSeries(LocalDate startDate, LocalDate endDate);

    ProductionAnalyticsResponse getProductionAnalytics();

    ProductionPeriodAnalyticsResponse getProductionPeriodAnalytics(LocalDate startDate, LocalDate endDate);
}
