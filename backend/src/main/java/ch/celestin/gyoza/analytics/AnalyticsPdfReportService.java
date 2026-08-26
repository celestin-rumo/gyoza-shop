package ch.celestin.gyoza.analytics;

import ch.celestin.gyoza.analytics.dto.AnalyticsDayPoint;
import ch.celestin.gyoza.analytics.dto.AnalyticsTimeSeriesResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse.ParticipantHours;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse.RawMaterialCostPoint;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse.SessionPeriodPoint;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtils;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.Axis;
import org.jfree.chart.axis.CategoryLabelPositions;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.Plot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.XYPlot;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.chart.renderer.category.LineAndShapeRenderer;
import org.jfree.chart.renderer.xy.XYLineAndShapeRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.time.Day;
import org.jfree.data.time.TimeSeries;
import org.jfree.data.time.TimeSeriesCollection;
import org.springframework.stereotype.Service;

import java.awt.BasicStroke;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

/**
 * Builds the "export analytics as PDF" report for a date range: an overview table plus
 * daily revenue/orders/new-customers charts, a raw-material cost breakdown, and — when
 * the period has production sessions — a profitability table and per-session charts.
 * Charts are rendered server-side with JFreeChart (Chart.js, used on the admin
 * dashboard, only runs in a browser canvas) and embedded as PNGs into an OpenPDF
 * document, two per row to keep the report compact.
 */
@Service
public class AnalyticsPdfReportService {

    static {
        // Chart rendering must not touch a display server (there isn't one on the
        // deployment host); JFreeChart falls back to pure off-screen rendering.
        System.setProperty("java.awt.headless", "true");
    }

    private static final DateTimeFormatter FULL_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    // Rendered at a higher resolution than the display size below so the PNG stays crisp
    // once scaled down to its half-page slot.
    private static final int CHART_RENDER_WIDTH = 600;
    private static final int CHART_RENDER_HEIGHT = 360;
    private static final float CHART_DISPLAY_WIDTH = 230f;
    private static final float CHART_DISPLAY_HEIGHT = 138f;

    private static final Color CORAL = new Color(0xE3, 0xA0, 0x90);
    private static final Color SAGE = new Color(0xA9, 0xAD, 0x8C);
    private static final Color GRID_COLOR = new Color(0xE8, 0xE8, 0xE8);
    private static final Color AXIS_COLOR = new Color(0x99, 0x99, 0x99);
    private static final Color CHART_TITLE_COLOR = new Color(0x33, 0x33, 0x33);

    // java.awt.Font (JFreeChart styling), not com.lowagie.text.Font (the PDF text below) — spelled
    // out fully since both classes are named "Font" and only one can be imported unqualified.
    private static final java.awt.Font CHART_TITLE_FONT = new java.awt.Font("SansSerif", java.awt.Font.BOLD, 12);
    private static final java.awt.Font AXIS_LABEL_FONT = new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 9);
    private static final java.awt.Font AXIS_TICK_FONT = new java.awt.Font("SansSerif", java.awt.Font.PLAIN, 8);

    private final AnalyticsService analyticsService;

    public AnalyticsPdfReportService(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /** @throws IllegalArgumentException if {@code startDate} is after {@code endDate} or the range exceeds 366 days */
    public byte[] generateReport(LocalDate startDate, LocalDate endDate) {
        AnalyticsTimeSeriesResponse timeSeries = analyticsService.getTimeSeries(startDate, endDate);
        ProductionPeriodAnalyticsResponse production = analyticsService.getProductionPeriodAnalytics(startDate, endDate);

        try {
            return render(startDate, endDate, timeSeries, production);
        } catch (DocumentException | IOException e) {
            throw new IllegalStateException("Impossible de générer le rapport PDF", e);
        }
    }

    private byte[] render(
            LocalDate startDate,
            LocalDate endDate,
            AnalyticsTimeSeriesResponse timeSeries,
            ProductionPeriodAnalyticsResponse production
    ) throws DocumentException, IOException {
        Document document = new Document(PageSize.A4, 40, 40, 50, 40);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Color.DARK_GRAY);
        Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 11);

        Paragraph title = new Paragraph("Gyoza Maison — Rapport analytics", titleFont);
        title.setSpacingAfter(4);
        document.add(title);

        Paragraph subtitle = new Paragraph(
                "Période du %s au %s — généré le %s".formatted(
                        startDate.format(FULL_DATE_FORMAT),
                        endDate.format(FULL_DATE_FORMAT),
                        LocalDate.now().format(FULL_DATE_FORMAT)
                ),
                subtitleFont
        );
        subtitle.setSpacingAfter(20);
        document.add(subtitle);

        List<AnalyticsDayPoint> days = timeSeries.days();
        BigDecimal periodRevenue = days.stream().map(AnalyticsDayPoint::revenue).reduce(BigDecimal.ZERO, BigDecimal::add);
        long periodOrders = days.stream().mapToLong(AnalyticsDayPoint::orderCount).sum();
        long periodNewCustomers = days.stream().mapToLong(AnalyticsDayPoint::newCustomerCount).sum();
        BigDecimal averageOrderValue = periodOrders > 0
                ? periodRevenue.divide(BigDecimal.valueOf(periodOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, String> overviewRows = new LinkedHashMap<>();
        overviewRows.put("Chiffre d'affaires", formatMoney(periodRevenue));
        overviewRows.put("Commandes", String.valueOf(periodOrders));
        overviewRows.put("Nouveaux clients", String.valueOf(periodNewCustomers));
        overviewRows.put("Panier moyen", formatMoney(averageOrderValue));

        addSectionTitle(document, "Vue d'ensemble", sectionFont);
        document.add(summaryTable(bodyFont, overviewRows));

        addChartRow(
                document,
                dayChart("Chiffre d'affaires par jour", days, AnalyticsDayPoint::revenue, "CA (CHF)"),
                dayChart("Commandes par jour", days, day -> BigDecimal.valueOf(day.orderCount()), "Commandes")
        );
        addChartRow(
                document,
                dayChart("Nouveaux clients par jour", days, day -> BigDecimal.valueOf(day.newCustomerCount()), "Clients"),
                null
        );

        if (!production.rawMaterialCosts().isEmpty()) {
            Map<String, String> materialRows = new LinkedHashMap<>();
            materialRows.put("Coût matière première total", formatMoney(production.totalMaterialCost()));

            addSectionTitle(document, "Coût des matières premières", sectionFont);
            document.add(summaryTable(bodyFont, materialRows));
            document.add(rawMaterialCostTable(bodyFont, production.rawMaterialCosts()));
        }

        if (!production.sessions().isEmpty()) {
            Map<String, String> productionRows = new LinkedHashMap<>();
            productionRows.put("Revenu horaire moyen", formatMoney(production.averageHourlyRevenue()) + "/h");
            productionRows.put("Coût matière / gyoza (moyen)", formatMoney(production.averageMaterialCostPerGyoza()));
            productionRows.put("Bénéfice brut cumulé", formatMoney(production.totalGrossProfit()));
            productionRows.put("Bénéfice net cumulé", formatMoney(production.totalNetProfit()));

            addSectionTitle(document, "Rentabilité de production", sectionFont);
            document.add(summaryTable(bodyFont, productionRows));

            addChartRow(
                    document,
                    sessionChart("Revenu horaire par session", production.sessions(), SessionPeriodPoint::hourlyRevenue, "CHF/h"),
                    sessionProfitChart(production.sessions())
            );

            if (!production.participantHours().isEmpty()) {
                addSectionTitle(document, "Heures par participant", sectionFont);
                document.add(participantTable(bodyFont, production.participantHours()));
            }
        }

        document.close();
        return out.toByteArray();
    }

    /**
     * Uses a real date axis (not one category per day) so JFreeChart spaces ticks
     * itself — a category axis with one label per day turns illegible past ~2 weeks.
     */
    private JFreeChart dayChart(
            String title,
            List<AnalyticsDayPoint> days,
            Function<AnalyticsDayPoint, BigDecimal> valueExtractor,
            String valueAxisLabel
    ) {
        TimeSeries series = new TimeSeries(valueAxisLabel);

        for (AnalyticsDayPoint day : days) {
            LocalDate date = day.date();
            series.add(new Day(date.getDayOfMonth(), date.getMonthValue(), date.getYear()), valueExtractor.apply(day));
        }

        JFreeChart chart = ChartFactory.createTimeSeriesChart(
                title, "Jour", valueAxisLabel, new TimeSeriesCollection(series), false, false, false
        );

        XYLineAndShapeRenderer renderer = new XYLineAndShapeRenderer(true, false);
        renderer.setSeriesPaint(0, CORAL);
        renderer.setSeriesStroke(0, new BasicStroke(2.2f));
        chart.getXYPlot().setRenderer(renderer);

        prettifyChart(chart);
        return chart;
    }

    private JFreeChart sessionChart(
            String title,
            List<SessionPeriodPoint> sessions,
            Function<SessionPeriodPoint, BigDecimal> valueExtractor,
            String valueAxisLabel
    ) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();

        for (SessionPeriodPoint session : sessions) {
            dataset.addValue(valueExtractor.apply(session), valueAxisLabel, session.batchNumber());
        }

        JFreeChart chart = ChartFactory.createLineChart(
                title, "Session", valueAxisLabel, dataset, PlotOrientation.VERTICAL, false, false, false
        );

        LineAndShapeRenderer renderer = (LineAndShapeRenderer) chart.getCategoryPlot().getRenderer();
        renderer.setSeriesPaint(0, CORAL);
        renderer.setSeriesStroke(0, new BasicStroke(2.2f));
        renderer.setSeriesShapesVisible(0, false);

        styleCategoryChart(chart);
        return chart;
    }

    private JFreeChart sessionProfitChart(List<SessionPeriodPoint> sessions) {
        DefaultCategoryDataset dataset = new DefaultCategoryDataset();

        for (SessionPeriodPoint session : sessions) {
            dataset.addValue(session.grossProfit(), "Bénéfice brut", session.batchNumber());
            dataset.addValue(session.netProfit(), "Bénéfice net", session.batchNumber());
        }

        JFreeChart chart = ChartFactory.createBarChart(
                "Bénéfice brut et net par session", "Session", "CHF", dataset, PlotOrientation.VERTICAL, true, false, false
        );

        BarRenderer renderer = (BarRenderer) chart.getCategoryPlot().getRenderer();
        renderer.setSeriesPaint(0, CORAL);
        renderer.setSeriesPaint(1, SAGE);
        renderer.setDrawBarOutline(false);
        renderer.setMaximumBarWidth(0.12);
        renderer.setItemMargin(0.15);

        styleCategoryChart(chart);
        return chart;
    }

    /** Rotated labels so batch numbers don't overlap into an illegible smear. */
    private void styleCategoryChart(JFreeChart chart) {
        chart.getCategoryPlot()
                .getDomainAxis()
                .setCategoryLabelPositions(CategoryLabelPositions.createUpRotationLabelPositions(Math.PI / 4));
        prettifyChart(chart);
    }

    /** Common flat, brand-colored look applied to every chart: white background, no
     *  outline, muted gridlines/axes, smaller non-default fonts. */
    private void prettifyChart(JFreeChart chart) {
        chart.setBackgroundPaint(Color.WHITE);
        chart.getTitle().setFont(CHART_TITLE_FONT);
        chart.getTitle().setPaint(CHART_TITLE_COLOR);

        if (chart.getLegend() != null) {
            chart.getLegend().setItemFont(AXIS_TICK_FONT);
            chart.getLegend().setBackgroundPaint(Color.WHITE);
        }

        Plot plot = chart.getPlot();
        plot.setBackgroundPaint(Color.WHITE);
        plot.setOutlineVisible(false);

        if (plot instanceof CategoryPlot categoryPlot) {
            categoryPlot.setDomainGridlinesVisible(false);
            categoryPlot.setRangeGridlinePaint(GRID_COLOR);
            prettifyAxis(categoryPlot.getDomainAxis());
            prettifyAxis(categoryPlot.getRangeAxis());
        } else if (plot instanceof XYPlot xyPlot) {
            xyPlot.setDomainGridlinePaint(GRID_COLOR);
            xyPlot.setRangeGridlinePaint(GRID_COLOR);
            prettifyAxis(xyPlot.getDomainAxis());
            prettifyAxis(xyPlot.getRangeAxis());
        }
    }

    private void prettifyAxis(Axis axis) {
        axis.setLabelFont(AXIS_LABEL_FONT);
        axis.setLabelPaint(AXIS_COLOR);
        axis.setTickLabelFont(AXIS_TICK_FONT);
        axis.setTickLabelPaint(AXIS_COLOR);
        axis.setAxisLinePaint(GRID_COLOR);
        axis.setTickMarkPaint(GRID_COLOR);
    }

    /** Two charts side by side per row; pass {@code right = null} to leave the slot blank. */
    private void addChartRow(Document document, JFreeChart left, JFreeChart right) throws IOException, DocumentException {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(14);

        table.addCell(chartCell(left));
        table.addCell(right != null ? chartCell(right) : blankCell());

        document.add(table);
    }

    private PdfPCell chartCell(JFreeChart chart) throws IOException, DocumentException {
        ByteArrayOutputStream imageBytes = new ByteArrayOutputStream();
        ChartUtils.writeChartAsPNG(imageBytes, chart, CHART_RENDER_WIDTH, CHART_RENDER_HEIGHT);

        Image image = Image.getInstance(imageBytes.toByteArray());
        image.scaleToFit(CHART_DISPLAY_WIDTH, CHART_DISPLAY_HEIGHT);

        PdfPCell cell = new PdfPCell();
        cell.addElement(image);
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell blankCell() {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }

    private void addSectionTitle(Document document, String text, Font font) throws DocumentException {
        Paragraph paragraph = new Paragraph(text, font);
        paragraph.setSpacingBefore(12);
        paragraph.setSpacingAfter(8);
        document.add(paragraph);
    }

    private PdfPTable summaryTable(Font font, Map<String, String> rows) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        for (Map.Entry<String, String> entry : rows.entrySet()) {
            table.addCell(labelCell(entry.getKey(), font));

            PdfPCell valueCell = labelCell(entry.getValue(), font);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(valueCell);
        }

        return table;
    }

    private PdfPTable rawMaterialCostTable(Font font, List<RawMaterialCostPoint> costs) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        table.addCell(labelCell("Matière première", font));

        PdfPCell header = labelCell("Coût", font);
        header.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(header);

        for (RawMaterialCostPoint cost : costs) {
            table.addCell(labelCell(cost.rawMaterialName(), font));

            PdfPCell valueCell = labelCell(formatMoney(cost.totalCost()), font);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(valueCell);
        }

        return table;
    }

    private PdfPTable participantTable(Font font, List<ParticipantHours> hours) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        table.addCell(labelCell("Participant", font));

        PdfPCell hoursHeader = labelCell("Heures", font);
        hoursHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(hoursHeader);

        for (ParticipantHours entry : hours) {
            table.addCell(labelCell(entry.participantName(), font));

            PdfPCell valueCell = labelCell(entry.hours() + " h", font);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(valueCell);
        }

        return table;
    }

    private PdfPCell labelCell(String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBorder(Rectangle.BOTTOM);
        cell.setPadding(6);
        return cell;
    }

    private String formatMoney(BigDecimal value) {
        return "CHF " + value.setScale(2, RoundingMode.HALF_UP);
    }
}
