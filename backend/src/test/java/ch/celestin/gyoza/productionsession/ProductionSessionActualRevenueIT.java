package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.rawmaterial.RawMaterialRepository;
import ch.celestin.gyoza.slot.SlotAvailability;
import ch.celestin.gyoza.slot.SlotAvailabilityRepository;
import ch.celestin.gyoza.support.AbstractIntegrationTest;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-end coverage for the real-order -> production-session revenue attribution flow:
 * create a session, place a real order against its output, walk it to DELIVERED, and confirm
 * the session's "actual" figures reflect it — while a cancelled order never counts.
 */
class ProductionSessionActualRevenueIT extends AbstractIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private PackOptionRepository packOptionRepository;

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SlotAvailabilityRepository slotAvailabilityRepository;

    @Test
    void deliveredOrder_countsTowardActualRevenue_butCancelledOrderDoesNot() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        // Kept inactive so it doesn't leak into the public catalog and affect ProductControllerIT's
        // assertions about the seeded catalog's exact size — same reasoning as elsewhere in this suite.
        Product product = new Product("Tofu gyoza", 0);
        product.deactivate();
        product = productRepository.save(product);
        packOptionRepository.save(new PackOption(product, 1, new BigDecimal("2.00")));

        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Tofu", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie sessionCsrf = fetchCsrfCookie();
        var sessionResult = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(sessionCsrf)
                        .header("X-XSRF-TOKEN", sessionCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-26",
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 50}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), product.getId())))
                .andExpect(status().isOk())
                .andReturn();

        Integer sessionId = JsonPath.read(sessionResult.getResponse().getContentAsString(), "$.id");

        // Far enough in the future to never collide with DataInitializer's relative-to-"now"
        // seeded slots (next Tuesday/Saturday) — same reasoning as OrderControllerIT's dates.
        LocalDate orderDate = LocalDate.of(2027, 3, 15);
        slotAvailabilityRepository.save(new SlotAvailability(
                orderDate, FulfillmentMethod.PICKUP, LocalTime.of(10, 0), LocalTime.of(12, 0), ContentType.FROZEN
        ));

        PackOption pack = packOptionRepository.findByProductId(product.getId()).get(0);

        // First order: will be delivered, so it must count.
        PlacedOrder deliveredOrder = placeOrder(pack.getId(), 20, orderDate);
        deliverOrder(adminSession, deliveredOrder);

        // Second order: will be cancelled, so it must NOT count even though it also consumes stock.
        PlacedOrder cancelledOrder = placeOrder(pack.getId(), 5, orderDate);
        cancelOrder(adminSession, cancelledOrder.orderId());

        mockMvc.perform(get("/api/admin/production-sessions/{id}", sessionId).session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.actualSummary.unitsSold", is(20)))
                .andExpect(jsonPath("$.actualSummary.unitsRemaining", is(25))) // 50 - 20 - 5
                .andExpect(jsonPath("$.actualSummary.actualRevenue", is(40.0))) // 20 x 2.00
                .andExpect(jsonPath("$.outputs[0].unitsSold", is(20)))
                .andExpect(jsonPath("$.outputs[0].actualRevenue", is(40.0)));
    }

    @Test
    void updateSession_removingAnOutputAlreadyDeliveredFrom_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product soldProduct = new Product("Riz gyoza vendu", 0);
        soldProduct.deactivate();
        soldProduct = productRepository.save(soldProduct);
        packOptionRepository.save(new PackOption(soldProduct, 1, new BigDecimal("2.00")));

        Product untouchedProduct = new Product("Nouille gyoza intacte", 0);
        untouchedProduct.deactivate();
        untouchedProduct = productRepository.save(untouchedProduct);

        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Riz vendu", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie sessionCsrf = fetchCsrfCookie();
        var sessionResult = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(sessionCsrf)
                        .header("X-XSRF-TOKEN", sessionCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-28",
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 50},
                                    {"productId": %d, "quantityProduced": 20}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), soldProduct.getId(), untouchedProduct.getId())))
                .andExpect(status().isOk())
                .andReturn();

        Integer sessionId = JsonPath.read(sessionResult.getResponse().getContentAsString(), "$.id");

        LocalDate orderDate = LocalDate.of(2027, 4, 20);
        slotAvailabilityRepository.save(new SlotAvailability(
                orderDate, FulfillmentMethod.PICKUP, LocalTime.of(10, 0), LocalTime.of(12, 0), ContentType.FROZEN
        ));

        PackOption pack = packOptionRepository.findByProductId(soldProduct.getId()).get(0);
        deliverOrder(adminSession, placeOrder(pack.getId(), 5, orderDate));

        // Dropping the sold product's output line entirely must be rejected — something has
        // already been delivered from it.
        Cookie updateCsrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/production-sessions/{id}", sessionId)
                        .session(adminSession)
                        .cookie(updateCsrf)
                        .header("X-XSRF-TOKEN", updateCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 20}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), untouchedProduct.getId())))
                .andExpect(status().isBadRequest());
    }

    private PlacedOrder placeOrder(Long packId, int quantity, LocalDate date) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        var result = mockMvc.perform(post("/api/orders")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": "1 rue du Test, Lausanne"
                                  },
                                  "lines": [{"packId": %d, "quantity": %d}],
                                  "fulfillmentMethod": "PICKUP",
                                  "date": "%s",
                                  "startTime": "10:00",
                                  "endTime": "12:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(packId, quantity, date)))
                .andExpect(status().isCreated())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        Integer orderId = JsonPath.read(body, "$.id");
        Number itemId = JsonPath.read(body, "$.items[0].id");

        return new PlacedOrder(orderId, itemId.longValue());
    }

    private void deliverOrder(MockHttpSession adminSession, PlacedOrder order) throws Exception {
        updateOrderStatus(adminSession, order.orderId(), "PREPARING");
        // Every item's batch/lot number must be checked before an order can become READY.
        validateItemBatch(adminSession, order.orderId(), order.itemId());
        updateOrderStatus(adminSession, order.orderId(), "READY");
        updateOrderStatus(adminSession, order.orderId(), "DELIVERED");
    }

    private void cancelOrder(MockHttpSession adminSession, Integer orderId) throws Exception {
        updateOrderStatus(adminSession, orderId, "CANCELLED");
    }

    private void validateItemBatch(MockHttpSession adminSession, Integer orderId, Long itemId) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(patch("/api/admin/orders/{orderId}/items/{itemId}/batch-validation", orderId, itemId)
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"validated": true}
                                """))
                .andExpect(status().isOk());
    }

    private record PlacedOrder(Integer orderId, Long itemId) {
    }

    private void updateOrderStatus(MockHttpSession adminSession, Integer orderId, String status) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(patch("/api/admin/orders/{id}/status", orderId)
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "%s"}
                                """.formatted(status)))
                .andExpect(status().isOk());
    }
}
