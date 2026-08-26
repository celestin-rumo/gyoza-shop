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
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

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

/**
 * Builds the "export analytics as PDF" report for a date range: raw data tables grouped
 * by category — an overview (daily revenue/orders/new customers), a raw-material cost
 * breakdown, and — when the period has production sessions — a per-session breakdown and
 * hours per participant.
 */
@Service
public class AnalyticsPdfReportService {

    private static final DateTimeFormatter FULL_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter SHORT_DATE_FORMAT = DateTimeFormatter.ofPattern("dd.MM");

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
        Font tableHeaderFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10);
        Font tableBodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10);

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
        document.add(dailyBreakdownTable(tableHeaderFont, tableBodyFont, days));

        if (!production.rawMaterialCosts().isEmpty()) {
            Map<String, String> materialRows = new LinkedHashMap<>();
            materialRows.put("Coût matière première total", formatMoney(production.totalMaterialCost()));

            addSectionTitle(document, "Coût des matières premières", sectionFont);
            document.add(summaryTable(bodyFont, materialRows));
            document.add(rawMaterialCostTable(tableHeaderFont, tableBodyFont, production.rawMaterialCosts()));
        }

        if (!production.sessions().isEmpty()) {
            Map<String, String> productionRows = new LinkedHashMap<>();
            productionRows.put("Revenu horaire moyen", formatMoney(production.averageHourlyRevenue()) + "/h");
            productionRows.put("Coût matière / gyoza (moyen)", formatMoney(production.averageMaterialCostPerGyoza()));
            productionRows.put("Bénéfice brut cumulé", formatMoney(production.totalGrossProfit()));
            productionRows.put("Bénéfice net cumulé", formatMoney(production.totalNetProfit()));

            addSectionTitle(document, "Rentabilité de production", sectionFont);
            document.add(summaryTable(bodyFont, productionRows));
            document.add(sessionsTable(tableHeaderFont, tableBodyFont, production.sessions()));

            if (!production.participantHours().isEmpty()) {
                addSectionTitle(document, "Heures par participant", sectionFont);
                document.add(participantTable(bodyFont, production.participantHours()));
            }
        }

        document.close();
        return out.toByteArray();
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

    private PdfPTable dailyBreakdownTable(Font headerFont, Font bodyFont, List<AnalyticsDayPoint> days) {
        PdfPTable table = new PdfPTable(4);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);
        table.setWidths(new float[]{1.2f, 1, 1, 1.3f});

        addHeaderRow(table, headerFont, "Jour", "Commandes", "Nouveaux clients", "Chiffre d'affaires");

        for (AnalyticsDayPoint day : days) {
            table.addCell(labelCell(day.date().format(SHORT_DATE_FORMAT), bodyFont));

            PdfPCell orders = labelCell(String.valueOf(day.orderCount()), bodyFont);
            orders.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(orders);

            PdfPCell newCustomers = labelCell(String.valueOf(day.newCustomerCount()), bodyFont);
            newCustomers.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(newCustomers);

            PdfPCell revenue = labelCell(formatMoney(day.revenue()), bodyFont);
            revenue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(revenue);
        }

        return table;
    }

    private PdfPTable sessionsTable(Font headerFont, Font bodyFont, List<SessionPeriodPoint> sessions) {
        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);
        table.setWidths(new float[]{1.3f, 1, 1.1f, 1.2f, 1, 1});

        addHeaderRow(
                table, headerFont,
                "Session", "Date", "Revenu horaire", "Coût matière / gyoza", "Bénéfice brut", "Bénéfice net"
        );

        for (SessionPeriodPoint session : sessions) {
            table.addCell(labelCell(session.batchNumber(), bodyFont));
            table.addCell(labelCell(session.date().format(SHORT_DATE_FORMAT), bodyFont));

            PdfPCell hourlyRevenue = labelCell(formatMoney(session.hourlyRevenue()) + "/h", bodyFont);
            hourlyRevenue.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(hourlyRevenue);

            PdfPCell materialCost = labelCell(formatMoney(session.materialCostPerGyoza()), bodyFont);
            materialCost.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(materialCost);

            PdfPCell grossProfit = labelCell(formatMoney(session.grossProfit()), bodyFont);
            grossProfit.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(grossProfit);

            PdfPCell netProfit = labelCell(formatMoney(session.netProfit()), bodyFont);
            netProfit.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(netProfit);
        }

        return table;
    }

    private PdfPTable rawMaterialCostTable(Font headerFont, Font bodyFont, List<RawMaterialCostPoint> costs) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        addHeaderRow(table, headerFont, "Matière première", "Coût");

        for (RawMaterialCostPoint cost : costs) {
            table.addCell(labelCell(cost.rawMaterialName(), bodyFont));

            PdfPCell valueCell = labelCell(formatMoney(cost.totalCost()), bodyFont);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(valueCell);
        }

        return table;
    }

    private PdfPTable participantTable(Font font, List<ParticipantHours> hours) {
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setSpacingAfter(16);

        addHeaderRow(table, font, "Participant", "Heures");

        for (ParticipantHours entry : hours) {
            table.addCell(labelCell(entry.participantName(), font));

            PdfPCell valueCell = labelCell(entry.hours() + " h", font);
            valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            table.addCell(valueCell);
        }

        return table;
    }

    private void addHeaderRow(PdfPTable table, Font font, String... columns) {
        for (int i = 0; i < columns.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(columns[i], font));
            cell.setBorder(Rectangle.BOTTOM);
            cell.setPadding(6);
            cell.setHorizontalAlignment(i == 0 ? Element.ALIGN_LEFT : Element.ALIGN_RIGHT);
            table.addCell(cell);
        }
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
