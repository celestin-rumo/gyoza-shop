package ch.celestin.gyoza.analytics;

import ch.celestin.gyoza.analytics.dto.AnalyticsDayPoint;
import ch.celestin.gyoza.analytics.dto.AnalyticsTimeSeriesResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse.ParticipantHours;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse.SessionPeriodPoint;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AnalyticsPdfReportServiceTest {

    private static final LocalDate START = LocalDate.of(2026, 8, 1);
    private static final LocalDate END = LocalDate.of(2026, 8, 3);

    @Mock
    private AnalyticsService analyticsService;

    @InjectMocks
    private AnalyticsPdfReportService reportService;

    @Test
    void generateReport_withProductionSessions_returnsANonEmptyPdf() {
        when(analyticsService.getTimeSeries(START, END)).thenReturn(new AnalyticsTimeSeriesResponse(List.of(
                new AnalyticsDayPoint(START, BigDecimal.valueOf(120), 3, 1, Map.of("Poulet", 24)),
                new AnalyticsDayPoint(START.plusDays(1), BigDecimal.valueOf(80), 2, 0, Map.of("Poulet", 16)),
                new AnalyticsDayPoint(END, BigDecimal.ZERO, 0, 0, Map.of())
        )));

        when(analyticsService.getProductionPeriodAnalytics(START, END)).thenReturn(new ProductionPeriodAnalyticsResponse(
                START,
                END,
                BigDecimal.valueOf(45),
                BigDecimal.TEN,
                BigDecimal.valueOf(0.5),
                BigDecimal.ONE,
                BigDecimal.valueOf(300),
                BigDecimal.valueOf(250),
                List.of(new SessionPeriodPoint(START, "B-001", BigDecimal.valueOf(45), BigDecimal.valueOf(0.5), BigDecimal.valueOf(150), BigDecimal.valueOf(125))),
                List.of(new ParticipantHours("Jean Dupont", BigDecimal.valueOf(4)))
        ));

        byte[] pdf = reportService.generateReport(START, END);

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    void generateReport_withNoProductionSessions_stillReturnsAPdf() {
        when(analyticsService.getTimeSeries(START, END)).thenReturn(new AnalyticsTimeSeriesResponse(List.of(
                new AnalyticsDayPoint(START, BigDecimal.ZERO, 0, 0, Map.of())
        )));

        when(analyticsService.getProductionPeriodAnalytics(START, END)).thenReturn(new ProductionPeriodAnalyticsResponse(
                START, END, BigDecimal.ZERO, null, BigDecimal.ZERO, null, BigDecimal.ZERO, BigDecimal.ZERO, List.of(), List.of()
        ));

        byte[] pdf = reportService.generateReport(START, END);

        assertThat(pdf).isNotEmpty();
        assertThat(new String(pdf, 0, 4, java.nio.charset.StandardCharsets.US_ASCII)).isEqualTo("%PDF");
    }

    @Test
    void generateReport_propagatesValidationFromTheUnderlyingService() {
        when(analyticsService.getTimeSeries(any(), any()))
                .thenThrow(new IllegalArgumentException("La date de début doit précéder la date de fin"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> reportService.generateReport(END, START))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
