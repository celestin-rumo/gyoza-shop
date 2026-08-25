package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.order.OrderStatus;
import ch.celestin.gyoza.product.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Derives every session profitability figure from the frozen per-line inputs
 * ({@link RawMaterialUsage#getUnitCost()} and {@link ProductOutput#getUnitSalePrice()}) plus
 * immutable structural data (quantities, participant count). Since those inputs never change
 * after the session is created, every value here stays frozen automatically without needing
 * to be persisted itself.
 */
public final class ProductionSessionCostCalculator {

    private ProductionSessionCostCalculator() {
    }

    /**
     * Material cost attributed to each output's product. A usage line targeting a specific
     * product attributes its full cost to that product; a "shared" usage line (no target
     * product) is prorated across every output, proportional to the quantity each one
     * produced. Keyed by the {@link Product} entity itself (default identity equality) rather
     * than its id: every reference here comes from the same persistence context/entity graph
     * within one transaction, so JPA guarantees the same row resolves to the same object.
     */
    public static Map<Product, BigDecimal> materialCostByProduct(ProductionSession session) {
        List<ProductOutput> outputs = session.getOutputs();
        int totalGyoza = totalGyozaProduced(session);

        Map<Product, BigDecimal> costByProduct = new HashMap<>();

        for (RawMaterialUsage usage : session.getRawMaterialUsages()) {
            BigDecimal lineCost = usage.getUnitCost().multiply(usage.getQuantityUsed());
            Product targetProduct = usage.getTargetProduct();

            if (targetProduct != null) {
                costByProduct.merge(targetProduct, lineCost, BigDecimal::add);
            } else if (totalGyoza > 0) {
                for (ProductOutput output : outputs) {
                    BigDecimal share = lineCost
                            .multiply(BigDecimal.valueOf(output.getQuantityProduced()))
                            .divide(BigDecimal.valueOf(totalGyoza), 6, RoundingMode.HALF_UP);
                    costByProduct.merge(output.getProduct(), share, BigDecimal::add);
                }
            }
        }

        return costByProduct;
    }

    public static BigDecimal materialCostForOutput(ProductionSession session, ProductOutput output) {
        return materialCostByProduct(session).getOrDefault(output.getProduct(), BigDecimal.ZERO);
    }

    public static BigDecimal costPerGyozaForOutput(ProductionSession session, ProductOutput output) {
        BigDecimal materialCost = materialCostForOutput(session, output);

        if (output.getQuantityProduced() <= 0) {
            return BigDecimal.ZERO;
        }

        return materialCost.divide(BigDecimal.valueOf(output.getQuantityProduced()), 4, RoundingMode.HALF_UP);
    }

    public static BigDecimal revenueForOutput(ProductOutput output) {
        return output.getUnitSalePrice().multiply(BigDecimal.valueOf(output.getQuantityProduced()));
    }

    public static int totalGyozaProduced(ProductionSession session) {
        return session.getOutputs().stream().mapToInt(ProductOutput::getQuantityProduced).sum();
    }

    public static BigDecimal totalMaterialCost(ProductionSession session) {
        return session.getRawMaterialUsages().stream()
                .map(usage -> usage.getUnitCost().multiply(usage.getQuantityUsed()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static BigDecimal theoreticalRevenue(ProductionSession session) {
        return session.getOutputs().stream()
                .map(ProductionSessionCostCalculator::revenueForOutput)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Cumulated person-hours (e.g. 2 people x 2h = 4h) — see ProductionSession.durationHours. */
    public static BigDecimal totalSessionHours(ProductionSession session) {
        return session.getDurationHours().multiply(BigDecimal.valueOf(session.getParticipants().size()));
    }

    public static Summary summary(ProductionSession session) {
        int totalGyoza = totalGyozaProduced(session);
        BigDecimal totalMaterialCost = totalMaterialCost(session);
        BigDecimal theoreticalRevenue = theoreticalRevenue(session);
        BigDecimal totalSessionHours = totalSessionHours(session);
        BigDecimal otherCosts = session.getOtherCosts();

        BigDecimal materialCostPerGyoza = totalGyoza > 0
                ? totalMaterialCost.divide(BigDecimal.valueOf(totalGyoza), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal timePerGyoza = totalGyoza > 0
                ? totalSessionHours.divide(BigDecimal.valueOf(totalGyoza), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal grossProfit = theoreticalRevenue.subtract(totalMaterialCost);
        BigDecimal netProfit = grossProfit.subtract(otherCosts);

        BigDecimal hourlyRevenue = totalSessionHours.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.divide(totalSessionHours, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal costBasis = totalMaterialCost.add(otherCosts);
        BigDecimal roi = costBasis.compareTo(BigDecimal.ZERO) > 0
                ? netProfit.multiply(BigDecimal.valueOf(100)).divide(costBasis, 2, RoundingMode.HALF_UP)
                : null;

        return new Summary(
                totalMaterialCost,
                totalGyoza,
                materialCostPerGyoza,
                totalSessionHours,
                timePerGyoza,
                theoreticalRevenue,
                grossProfit,
                otherCosts,
                netProfit,
                hourlyRevenue,
                roi
        );
    }

    public record Summary(
            BigDecimal totalMaterialCost,
            int totalGyozaProduced,
            BigDecimal materialCostPerGyoza,
            BigDecimal totalSessionHours,
            BigDecimal timePerGyoza,
            BigDecimal theoreticalRevenue,
            BigDecimal grossProfit,
            BigDecimal otherCosts,
            BigDecimal netProfit,
            BigDecimal hourlyRevenue,
            BigDecimal roi
    ) {
    }

    /**
     * "Réel" figures: only counts allocations whose order actually reached DELIVERED — a
     * cancelled or still-in-progress order never contributes, unlike the frozen catalog-based
     * {@link #theoreticalRevenue}. Computed live (not frozen) since it changes as orders are
     * delivered after the session was created.
     */
    public static int unitsSoldForOutput(ProductOutput output) {
        return output.getAllocations().stream()
                .filter(ProductionSessionCostCalculator::isDelivered)
                .mapToInt(ProductOutputAllocation::getQuantity)
                .sum();
    }

    public static BigDecimal actualRevenueForOutput(ProductOutput output) {
        return output.getAllocations().stream()
                .filter(ProductionSessionCostCalculator::isDelivered)
                .map(ProductionSessionCostCalculator::allocationRevenue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static boolean isDelivered(ProductOutputAllocation allocation) {
        return allocation.getOrderItem().getOrder().getStatus() == OrderStatus.DELIVERED;
    }

    private static BigDecimal allocationRevenue(ProductOutputAllocation allocation) {
        var orderItem = allocation.getOrderItem();

        BigDecimal unitPrice = orderItem.getUnitPackPrice()
                .divide(BigDecimal.valueOf(orderItem.getPackSize()), 4, RoundingMode.HALF_UP);

        return unitPrice.multiply(BigDecimal.valueOf(allocation.getQuantity()));
    }

    public static ActualSummary actualSummary(ProductionSession session) {
        int unitsSold = session.getOutputs().stream()
                .mapToInt(ProductionSessionCostCalculator::unitsSoldForOutput)
                .sum();

        int unitsRemaining = session.getOutputs().stream()
                .mapToInt(ProductOutput::getRemainingQuantity)
                .sum();

        BigDecimal actualRevenue = session.getOutputs().stream()
                .map(ProductionSessionCostCalculator::actualRevenueForOutput)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalMaterialCost = totalMaterialCost(session);
        BigDecimal otherCosts = session.getOtherCosts();
        BigDecimal totalSessionHours = totalSessionHours(session);

        BigDecimal actualGrossProfit = actualRevenue.subtract(totalMaterialCost);
        BigDecimal actualNetProfit = actualGrossProfit.subtract(otherCosts);

        BigDecimal actualHourlyRevenue = totalSessionHours.compareTo(BigDecimal.ZERO) > 0
                ? actualNetProfit.divide(totalSessionHours, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal costBasis = totalMaterialCost.add(otherCosts);
        BigDecimal actualRoi = costBasis.compareTo(BigDecimal.ZERO) > 0
                ? actualNetProfit.multiply(BigDecimal.valueOf(100)).divide(costBasis, 2, RoundingMode.HALF_UP)
                : null;

        return new ActualSummary(
                unitsSold,
                unitsRemaining,
                actualRevenue,
                actualGrossProfit,
                actualNetProfit,
                actualHourlyRevenue,
                actualRoi
        );
    }

    public record ActualSummary(
            int unitsSold,
            int unitsRemaining,
            BigDecimal actualRevenue,
            BigDecimal actualGrossProfit,
            BigDecimal actualNetProfit,
            BigDecimal actualHourlyRevenue,
            BigDecimal actualRoi
    ) {
    }
}
