package ch.celestin.gyoza.analytics;

import ch.celestin.gyoza.analytics.dto.AnalyticsDayPoint;
import ch.celestin.gyoza.analytics.dto.AnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.AnalyticsTimeSeriesResponse;
import ch.celestin.gyoza.analytics.dto.ProductionAnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse;
import ch.celestin.gyoza.analytics.dto.ProductionPeriodAnalyticsResponse.RawMaterialCostPoint;
import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.customer.CustomerRepository;
import ch.celestin.gyoza.order.Order;
import ch.celestin.gyoza.order.OrderItem;
import ch.celestin.gyoza.order.OrderRepository;
import ch.celestin.gyoza.order.OrderStatus;
import ch.celestin.gyoza.productionsession.ProductOutput;
import ch.celestin.gyoza.productionsession.ProductionSession;
import ch.celestin.gyoza.productionsession.ProductionSessionCostCalculator;
import ch.celestin.gyoza.productionsession.ProductionSessionRepository;
import ch.celestin.gyoza.productionsession.RawMaterialUsage;
import ch.celestin.gyoza.productionsession.SessionParticipant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final long MAX_RANGE_DAYS = 366;

    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;
    private final ProductionSessionRepository productionSessionRepository;

    public AnalyticsServiceImpl(
            CustomerRepository customerRepository,
            OrderRepository orderRepository,
            ProductionSessionRepository productionSessionRepository
    ) {
        this.customerRepository = customerRepository;
        this.orderRepository = orderRepository;
        this.productionSessionRepository = productionSessionRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {
        List<Customer> customers = customerRepository.findAll();
        List<Order> orders = orderRepository.findAll();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusWeeks(1);
        LocalDateTime monthAgo = now.minusMonths(1);
        LocalDateTime yearAgo = now.minusYears(1);

        long newCustomersLastWeek = customers.stream()
                .filter(customer -> customer.getCreatedAt() != null)
                .filter(customer -> customer.getCreatedAt().isAfter(weekAgo))
                .count();

        // Cancelled orders never happened commercially: excluded from revenue,
        // average basket, and every revenue-per-period figure below.
        List<Order> revenueOrders = orders.stream()
                .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                .toList();

        Map<OrderStatus, Long> ordersByStatus = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        BigDecimal totalRevenue = sumRevenue(revenueOrders);

        BigDecimal averageOrderValue = revenueOrders.isEmpty()
                ? BigDecimal.ZERO
                : totalRevenue.divide(BigDecimal.valueOf(revenueOrders.size()), 2, RoundingMode.HALF_UP);

        return new AnalyticsResponse(
                customers.size(),
                newCustomersLastWeek,
                orders.size(),
                ordersByStatus,
                averageOrderValue,
                sumRevenueSince(revenueOrders, weekAgo),
                sumRevenueSince(revenueOrders, monthAgo),
                sumRevenueSince(revenueOrders, yearAgo),
                totalRevenue
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AnalyticsTimeSeriesResponse getTimeSeries(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "La date de début doit précéder la date de fin"
            );
        }

        if (ChronoUnit.DAYS.between(startDate, endDate) + 1 > MAX_RANGE_DAYS) {
            throw new IllegalArgumentException(
                    "La période sélectionnée est trop longue (365 jours maximum)"
            );
        }

        Map<LocalDate, List<Order>> ordersByDate = orderRepository
                .findAll()
                .stream()
                .filter(order -> {
                    LocalDate date = order.getCreatedAt().toLocalDate();
                    return !date.isBefore(startDate) && !date.isAfter(endDate);
                })
                .collect(Collectors.groupingBy(order -> order.getCreatedAt().toLocalDate()));

        Map<LocalDate, Long> newCustomersByDate = customerRepository
                .findAll()
                .stream()
                .filter(customer -> customer.getCreatedAt() != null)
                .map(customer -> customer.getCreatedAt().toLocalDate())
                .filter(date -> !date.isBefore(startDate) && !date.isAfter(endDate))
                .collect(Collectors.groupingBy(date -> date, Collectors.counting()));

        List<AnalyticsDayPoint> points = new ArrayList<>();

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<Order> dayOrders = ordersByDate.getOrDefault(date, List.of());

            // Same rule as the summary: a cancelled order sold nothing, so it
            // contributes no revenue and no gyoza units, but it still counts
            // toward the day's order volume (it did arrive).
            List<Order> soldOrders = dayOrders.stream()
                    .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
                    .toList();

            BigDecimal revenue = sumRevenue(soldOrders);

            Map<String, Integer> unitsByProduct = new LinkedHashMap<>();

            for (Order order : soldOrders) {
                for (OrderItem item : order.getItems()) {
                    unitsByProduct.merge(
                            item.getProduct().getName(),
                            item.getPackSize() * item.getPackQuantity(),
                            Integer::sum
                    );
                }
            }

            points.add(new AnalyticsDayPoint(
                    date,
                    revenue,
                    dayOrders.size(),
                    newCustomersByDate.getOrDefault(date, 0L),
                    unitsByProduct
            ));
        }

        return new AnalyticsTimeSeriesResponse(points);
    }

    private BigDecimal sumRevenue(List<Order> orders) {
        return orders.stream()
                .map(Order::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal sumRevenueSince(List<Order> orders, LocalDateTime since) {
        return sumRevenue(
                orders.stream()
                        .filter(order -> order.getCreatedAt().isAfter(since))
                        .toList()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ProductionAnalyticsResponse getProductionAnalytics() {
        List<ProductionSession> sessions = productionSessionRepository.findAllByOrderByDateDesc();

        BigDecimal totalMaterialCost = BigDecimal.ZERO;
        BigDecimal totalNetProfit = BigDecimal.ZERO;
        BigDecimal totalActualRevenue = BigDecimal.ZERO;
        BigDecimal totalActualNetProfit = BigDecimal.ZERO;
        int totalGyoza = 0;

        // Blended approximation: a shared-flavor session's overall cost/gyoza is counted
        // toward every flavor it produced, since raw material usage isn't tracked per output.
        Map<String, List<BigDecimal>> costPerGyozaByFlavor = new LinkedHashMap<>();
        List<ProductionAnalyticsResponse.SessionCostPoint> points = new ArrayList<>();

        for (ProductionSession session : sessions) {
            ProductionSessionCostCalculator.Summary summary = ProductionSessionCostCalculator.summary(session);
            ProductionSessionCostCalculator.ActualSummary actualSummary =
                    ProductionSessionCostCalculator.actualSummary(session);

            totalMaterialCost = totalMaterialCost.add(summary.totalMaterialCost());
            totalNetProfit = totalNetProfit.add(summary.netProfit());
            totalActualRevenue = totalActualRevenue.add(actualSummary.actualRevenue());
            totalActualNetProfit = totalActualNetProfit.add(actualSummary.actualNetProfit());
            totalGyoza += summary.totalGyozaProduced();

            for (ProductOutput output : session.getOutputs()) {
                BigDecimal costPerGyoza = ProductionSessionCostCalculator.costPerGyozaForOutput(session, output);
                costPerGyozaByFlavor
                        .computeIfAbsent(output.getProduct().getName(), name -> new ArrayList<>())
                        .add(costPerGyoza);
            }

            points.add(new ProductionAnalyticsResponse.SessionCostPoint(
                    session.getDate(),
                    session.getBatchNumber(),
                    summary.totalMaterialCost(),
                    summary.netProfit(),
                    actualSummary.actualNetProfit()
            ));
        }

        Map<String, BigDecimal> averageCostPerGyozaByFlavor = new LinkedHashMap<>();
        for (Map.Entry<String, List<BigDecimal>> entry : costPerGyozaByFlavor.entrySet()) {
            BigDecimal sum = entry.getValue().stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            averageCostPerGyozaByFlavor.put(
                    entry.getKey(),
                    sum.divide(BigDecimal.valueOf(entry.getValue().size()), 4, RoundingMode.HALF_UP)
            );
        }

        BigDecimal averageMaterialCostPerGyoza = totalGyoza > 0
                ? totalMaterialCost.divide(BigDecimal.valueOf(totalGyoza), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new ProductionAnalyticsResponse(
                totalMaterialCost,
                totalNetProfit,
                averageMaterialCostPerGyoza,
                averageCostPerGyozaByFlavor,
                totalActualRevenue,
                totalActualNetProfit,
                // Chronological order for the "cost per session" bar chart, unlike the
                // date-descending order used elsewhere in this admin section.
                points.reversed()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ProductionPeriodAnalyticsResponse getProductionPeriodAnalytics(LocalDate startDate, LocalDate endDate) {
        if (startDate.isAfter(endDate)) {
            throw new IllegalArgumentException(
                    "La date de début doit précéder la date de fin"
            );
        }

        long rangeDays = ChronoUnit.DAYS.between(startDate, endDate) + 1;

        if (rangeDays > MAX_RANGE_DAYS) {
            throw new IllegalArgumentException(
                    "La période sélectionnée est trop longue (365 jours maximum)"
            );
        }

        PeriodAggregate current = aggregatePeriod(startDate, endDate);

        // Equal-length window immediately preceding the selected period, used only to derive
        // the trend arrows on the two averaged KPIs — never returned itself.
        LocalDate previousEnd = startDate.minusDays(1);
        LocalDate previousStart = previousEnd.minusDays(rangeDays - 1);
        PeriodAggregate previous = aggregatePeriod(previousStart, previousEnd);

        Map<String, BigDecimal> participantHoursByName = new LinkedHashMap<>();

        for (ProductionSession session : current.sessions()) {
            for (SessionParticipant participant : session.getParticipants()) {
                String name = participant.getUser().getFirstName() + " " + participant.getUser().getLastName();
                participantHoursByName.merge(name, session.getDurationHours(), BigDecimal::add);
            }
        }

        List<ProductionPeriodAnalyticsResponse.ParticipantHours> participantHours = participantHoursByName
                .entrySet()
                .stream()
                .map(entry -> new ProductionPeriodAnalyticsResponse.ParticipantHours(entry.getKey(), entry.getValue()))
                .sorted((a, b) -> b.hours().compareTo(a.hours()))
                .toList();

        return new ProductionPeriodAnalyticsResponse(
                startDate,
                endDate,
                current.averageHourlyRevenue(),
                changePercent(current.averageHourlyRevenue(), previous.averageHourlyRevenue(), !previous.sessions().isEmpty()),
                current.averageMaterialCostPerGyoza(),
                changePercent(current.averageMaterialCostPerGyoza(), previous.averageMaterialCostPerGyoza(), !previous.sessions().isEmpty()),
                current.totalGrossProfit(),
                current.totalNetProfit(),
                current.points(),
                participantHours,
                current.totalMaterialCost(),
                current.rawMaterialCosts()
        );
    }

    /** Ratio-of-totals aggregates for one date window — see {@link #getProductionPeriodAnalytics}. */
    private record PeriodAggregate(
            List<ProductionSession> sessions,
            List<ProductionPeriodAnalyticsResponse.SessionPeriodPoint> points,
            BigDecimal averageHourlyRevenue,
            BigDecimal averageMaterialCostPerGyoza,
            BigDecimal totalGrossProfit,
            BigDecimal totalNetProfit,
            BigDecimal totalMaterialCost,
            List<RawMaterialCostPoint> rawMaterialCosts
    ) {
    }

    private PeriodAggregate aggregatePeriod(LocalDate start, LocalDate end) {
        List<ProductionSession> sessions = productionSessionRepository.findAllByDateBetweenOrderByDateAsc(start, end);

        BigDecimal totalNetProfit = BigDecimal.ZERO;
        BigDecimal totalGrossProfit = BigDecimal.ZERO;
        BigDecimal totalMaterialCost = BigDecimal.ZERO;
        BigDecimal totalSessionHours = BigDecimal.ZERO;
        int totalGyoza = 0;

        List<ProductionPeriodAnalyticsResponse.SessionPeriodPoint> points = new ArrayList<>();
        Map<String, BigDecimal> materialCostByName = new LinkedHashMap<>();

        for (ProductionSession session : sessions) {
            ProductionSessionCostCalculator.Summary summary = ProductionSessionCostCalculator.summary(session);

            totalNetProfit = totalNetProfit.add(summary.netProfit());
            totalGrossProfit = totalGrossProfit.add(summary.grossProfit());
            totalMaterialCost = totalMaterialCost.add(summary.totalMaterialCost());
            totalSessionHours = totalSessionHours.add(summary.totalSessionHours());
            totalGyoza += summary.totalGyozaProduced();

            points.add(new ProductionPeriodAnalyticsResponse.SessionPeriodPoint(
                    session.getDate(),
                    session.getBatchNumber(),
                    summary.hourlyRevenue(),
                    summary.materialCostPerGyoza(),
                    summary.grossProfit(),
                    summary.netProfit()
            ));

            for (RawMaterialUsage usage : session.getRawMaterialUsages()) {
                BigDecimal lineCost = usage.getQuantityUsed().multiply(usage.getUnitCost());
                materialCostByName.merge(usage.getRawMaterial().getName(), lineCost, BigDecimal::add);
            }
        }

        List<RawMaterialCostPoint> rawMaterialCosts = materialCostByName.entrySet().stream()
                .map(entry -> new RawMaterialCostPoint(entry.getKey(), entry.getValue().setScale(2, RoundingMode.HALF_UP)))
                .sorted((a, b) -> b.totalCost().compareTo(a.totalCost()))
                .toList();

        // Ratio of period totals, not a mean of per-session rates, so a single short/tiny
        // session doesn't skew the average — same approach as averageMaterialCostPerGyoza above.
        BigDecimal averageHourlyRevenue = totalSessionHours.compareTo(BigDecimal.ZERO) > 0
                ? totalNetProfit.divide(totalSessionHours, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal averageMaterialCostPerGyoza = totalGyoza > 0
                ? totalMaterialCost.divide(BigDecimal.valueOf(totalGyoza), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new PeriodAggregate(
                sessions,
                points,
                averageHourlyRevenue,
                averageMaterialCostPerGyoza,
                totalGrossProfit,
                totalNetProfit,
                totalMaterialCost.setScale(2, RoundingMode.HALF_UP),
                rawMaterialCosts
        );
    }

    private BigDecimal changePercent(BigDecimal current, BigDecimal previous, boolean previousHasSessions) {
        if (!previousHasSessions || previous.compareTo(BigDecimal.ZERO) == 0) {
            return null;
        }

        return current.subtract(previous)
                .multiply(BigDecimal.valueOf(100))
                .divide(previous, 2, RoundingMode.HALF_UP);
    }
}
