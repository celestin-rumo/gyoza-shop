package ch.celestin.gyoza.analytics;

import ch.celestin.gyoza.analytics.dto.AnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.AnalyticsTimeSeriesResponse;
import ch.celestin.gyoza.analytics.dto.PackSalesPoint;
import ch.celestin.gyoza.analytics.dto.ProductionAnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse;

import java.time.LocalDate;
import java.util.List;

public interface AnalyticsService {

    AnalyticsResponse getAnalytics();

    AnalyticsTimeSeriesResponse getTimeSeries(LocalDate startDate, LocalDate endDate);

    ProductionAnalyticsResponse getProductionAnalytics();

    ProductionPeriodAnalyticsResponse getProductionPeriodAnalytics(LocalDate startDate, LocalDate endDate);

    /** Packs sold per size (e.g. 6, 12), regardless of flavor, over the period. */
    List<PackSalesPoint> getPackSales(LocalDate startDate, LocalDate endDate);
}
