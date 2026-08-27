package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import ch.celestin.gyoza.order.Order;
import ch.celestin.gyoza.order.OrderItem;
import ch.celestin.gyoza.order.OrderStatus;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;

class ProductionSessionCostCalculatorTest {

    private final LocalDate date = LocalDate.of(2026, 8, 24);
    private final RawMaterial rawMaterial = new RawMaterial("Farine", "kg");
    private final Product chicken = new Product("Poulet", 0);
    private final Product vegetable = new Product("Légumes", 0);

    private ProductionSession newSession(BigDecimal durationHours, BigDecimal otherCosts) {
        return new ProductionSession(date, "L20260824-01", durationHours, null, otherCosts);
    }

    private User newParticipant() {
        return new User(
                "cook@example.com", "hash", "Cel", "Nino",
                "Rue 1", "1000", "Lausanne", Role.ADMIN, true
        );
    }

    /** Builds an OrderItem attached to an order in the given status, for allocation tests. */
    private OrderItem newOrderItem(Product product, int packSize, int packQuantity, BigDecimal unitPackPrice, OrderStatus status) {
        Order order = new Order(
                new Customer("Jean", "Dupont", "jean@example.com", "1 rue du Test"),
                FulfillmentMethod.PICKUP,
                date, LocalTime.of(10, 0), LocalTime.of(12, 0), ContentType.FROZEN
        );

        OrderItem orderItem = new OrderItem(product, packSize, packQuantity, unitPackPrice);
        order.addItem(orderItem);

        if (status == OrderStatus.CANCELLED) {
            order.changeStatus(OrderStatus.CANCELLED);
        } else if (status == OrderStatus.DELIVERED) {
            order.changeStatus(OrderStatus.PREPARING);
            orderItem.setBatchValidated(true);
            order.changeStatus(OrderStatus.READY);
            order.changeStatus(OrderStatus.DELIVERED);
        }

        return orderItem;
    }

    @Test
    void materialCost_targetedUsage_isFullyAttributedToItsProduct() {
        ProductionSession session = newSession(new BigDecimal("2"), null);
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addOutput(new ProductOutput(chicken, 100, new BigDecimal("2")));
        session.addOutput(new ProductOutput(vegetable, 50, new BigDecimal("2")));
        session.addRawMaterialUsage(new RawMaterialUsage(rawMaterial, BigDecimal.TEN, new BigDecimal("3"), chicken));

        assertThat(ProductionSessionCostCalculator.totalMaterialCost(session)).isEqualByComparingTo("30");
        assertThat(ProductionSessionCostCalculator.materialCostByProduct(session).get(chicken))
                .isEqualByComparingTo("30");
        assertThat(ProductionSessionCostCalculator.materialCostByProduct(session)).doesNotContainKey(vegetable);
    }

    @Test
    void materialCost_sharedUsage_isProratedByQuantityProduced() {
        ProductionSession session = newSession(new BigDecimal("2"), null);
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addOutput(new ProductOutput(chicken, 75, new BigDecimal("2")));
        session.addOutput(new ProductOutput(vegetable, 25, new BigDecimal("2")));
        // Shared ingredient (no target product): 100 total cost, split 75/25 by quantity.
        session.addRawMaterialUsage(new RawMaterialUsage(rawMaterial, BigDecimal.TEN, BigDecimal.TEN, null));

        assertThat(ProductionSessionCostCalculator.materialCostByProduct(session).get(chicken))
                .isEqualByComparingTo("75");
        assertThat(ProductionSessionCostCalculator.materialCostByProduct(session).get(vegetable))
                .isEqualByComparingTo("25");
    }

    @Test
    void totalSessionHours_multipliesDurationByParticipantCount() {
        ProductionSession session = newSession(new BigDecimal("2"), null);
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addParticipant(new SessionParticipant(newParticipant()));

        assertThat(ProductionSessionCostCalculator.totalSessionHours(session)).isEqualByComparingTo("4");
    }

    @Test
    void summary_computesFullProfitabilityChain() {
        ProductionSession session = newSession(new BigDecimal("2"), new BigDecimal("5"));
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addOutput(new ProductOutput(chicken, 80, new BigDecimal("1.5")));
        session.addRawMaterialUsage(new RawMaterialUsage(rawMaterial, BigDecimal.TEN, new BigDecimal("2"), null));

        ProductionSessionCostCalculator.Summary summary = ProductionSessionCostCalculator.summary(session);

        assertThat(summary.totalMaterialCost()).isEqualByComparingTo("20");
        assertThat(summary.totalGyozaProduced()).isEqualTo(80);
        assertThat(summary.materialCostPerGyoza()).isEqualByComparingTo("0.25");
        assertThat(summary.totalSessionHours()).isEqualByComparingTo("4");
        assertThat(summary.timePerGyoza()).isEqualByComparingTo("0.05");
        assertThat(summary.theoreticalRevenue()).isEqualByComparingTo("120");
        assertThat(summary.grossProfit()).isEqualByComparingTo("100");
        assertThat(summary.otherCosts()).isEqualByComparingTo("5");
        assertThat(summary.netProfit()).isEqualByComparingTo("95");
        assertThat(summary.hourlyRevenue()).isEqualByComparingTo("23.75");
        assertThat(summary.roi()).isEqualByComparingTo("380.00");
    }

    @Test
    void summary_roiIsNull_whenCostBasisIsZero() {
        ProductionSession session = newSession(new BigDecimal("2"), null);
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addOutput(new ProductOutput(chicken, 10, BigDecimal.ZERO));

        ProductionSessionCostCalculator.Summary summary = ProductionSessionCostCalculator.summary(session);

        assertThat(summary.roi()).isNull();
    }

    @Test
    void actualRevenue_onlyCountsDeliveredOrders() {
        ProductOutput output = new ProductOutput(chicken, 80, new BigDecimal("1.5"));

        // Delivered: 10 gyoza at 2 CHF each (a 2-pack at 4 CHF) -> counts.
        OrderItem delivered = newOrderItem(chicken, 2, 5, new BigDecimal("4"), OrderStatus.DELIVERED);
        ProductOutputAllocation deliveredAllocation = new ProductOutputAllocation(output, 10);
        output.addAllocation(deliveredAllocation);
        delivered.addAllocation(deliveredAllocation);

        // Still reserved (not yet delivered): must not count.
        OrderItem reserved = newOrderItem(chicken, 2, 5, new BigDecimal("4"), OrderStatus.RESERVED);
        ProductOutputAllocation reservedAllocation = new ProductOutputAllocation(output, 10);
        output.addAllocation(reservedAllocation);
        reserved.addAllocation(reservedAllocation);

        // Cancelled: must not count either.
        OrderItem cancelled = newOrderItem(chicken, 2, 5, new BigDecimal("4"), OrderStatus.CANCELLED);
        ProductOutputAllocation cancelledAllocation = new ProductOutputAllocation(output, 10);
        output.addAllocation(cancelledAllocation);
        cancelled.addAllocation(cancelledAllocation);

        assertThat(ProductionSessionCostCalculator.unitsSoldForOutput(output)).isEqualTo(10);
        assertThat(ProductionSessionCostCalculator.actualRevenueForOutput(output)).isEqualByComparingTo("20");
    }

    @Test
    void actualSummary_computesFullActualChain() {
        ProductionSession session = newSession(new BigDecimal("2"), new BigDecimal("5"));
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addParticipant(new SessionParticipant(newParticipant()));
        ProductOutput output = new ProductOutput(chicken, 80, new BigDecimal("1.5"));
        session.addOutput(output);
        session.addRawMaterialUsage(new RawMaterialUsage(rawMaterial, BigDecimal.TEN, new BigDecimal("2"), null));

        // 40 of the 80 gyoza actually sold (delivered) at 2 CHF/gyoza -> 80 CHF actual revenue.
        OrderItem delivered = newOrderItem(chicken, 1, 40, new BigDecimal("2"), OrderStatus.DELIVERED);
        ProductOutputAllocation allocation = new ProductOutputAllocation(output, 40);
        output.addAllocation(allocation);
        delivered.addAllocation(allocation);
        output.consume(40);

        ProductionSessionCostCalculator.ActualSummary actual = ProductionSessionCostCalculator.actualSummary(session);

        assertThat(actual.unitsSold()).isEqualTo(40);
        assertThat(actual.unitsRemaining()).isEqualTo(40);
        assertThat(actual.actualRevenue()).isEqualByComparingTo("80");
        // Material cost is the same frozen 20 CHF as the théorique chain.
        assertThat(actual.actualGrossProfit()).isEqualByComparingTo("60");
        assertThat(actual.actualNetProfit()).isEqualByComparingTo("55");
        assertThat(actual.actualHourlyRevenue()).isEqualByComparingTo("13.75"); // 55 / 4h
        assertThat(actual.actualRoi()).isEqualByComparingTo("220.00"); // 55 * 100 / 25
    }

    @Test
    void actualSummary_defaultsToZero_whenNothingHasBeenAllocated() {
        ProductionSession session = newSession(new BigDecimal("2"), null);
        session.addParticipant(new SessionParticipant(newParticipant()));
        session.addOutput(new ProductOutput(chicken, 80, new BigDecimal("1.5")));

        ProductionSessionCostCalculator.ActualSummary actual = ProductionSessionCostCalculator.actualSummary(session);

        assertThat(actual.unitsSold()).isZero();
        assertThat(actual.unitsRemaining()).isEqualTo(80);
        assertThat(actual.actualRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(actual.actualRoi()).isNull();
    }
}
