package ch.celestin.gyoza.order;

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
import java.util.List;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Covers the batch-traceability gate: an order can't reach READY until every item's
 * production batch has been manually validated — see Order.changeStatus.
 */
class AdminOrderControllerIT extends AbstractIntegrationTest {

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
    void getOrders_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/orders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void order_cannotReachReady_untilEveryItemsBatchIsValidated() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = new Product("Boeuf gyoza", 0);
        product.deactivate();
        product = productRepository.save(product);
        packOptionRepository.save(new PackOption(product, 1, new BigDecimal("2.00")));

        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Boeuf", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie sessionCsrf = fetchCsrfCookie();
        var sessionResult = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(sessionCsrf)
                        .header("X-XSRF-TOKEN", sessionCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-27",
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

        String expectedBatchNumber = JsonPath.read(
                sessionResult.getResponse().getContentAsString(), "$.batchNumber"
        );

        LocalDate orderDate = LocalDate.of(2027, 4, 12);
        slotAvailabilityRepository.save(new SlotAvailability(
                orderDate, FulfillmentMethod.PICKUP, LocalTime.of(10, 0), LocalTime.of(12, 0), ContentType.FROZEN
        ));

        PackOption pack = packOptionRepository.findByProductId(product.getId()).get(0);

        Cookie orderCsrf = fetchCsrfCookie();
        var orderResult = mockMvc.perform(post("/api/orders")
                        .cookie(orderCsrf)
                        .header("X-XSRF-TOKEN", orderCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": "1 rue du Test, Lausanne"
                                  },
                                  "lines": [{"packId": %d, "quantity": 10}],
                                  "fulfillmentMethod": "PICKUP",
                                  "date": "%s",
                                  "startTime": "10:00",
                                  "endTime": "12:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(pack.getId(), orderDate)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items[0].batches[0].batchNumber", is(expectedBatchNumber)))
                .andExpect(jsonPath("$.items[0].batches[0].quantity", is(10)))
                .andExpect(jsonPath("$.items[0].batchValidated", is(false)))
                .andReturn();

        Integer orderId = JsonPath.read(orderResult.getResponse().getContentAsString(), "$.id");
        Integer itemId = JsonPath.read(orderResult.getResponse().getContentAsString(), "$.items[0].id");

        updateStatus(adminSession, orderId, "PREPARING");

        // Blocked: the item's batch hasn't been validated yet.
        Cookie readyCsrf = fetchCsrfCookie();
        mockMvc.perform(patch("/api/admin/orders/{id}/status", orderId)
                        .session(adminSession)
                        .cookie(readyCsrf)
                        .header("X-XSRF-TOKEN", readyCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status": "READY"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("ORDER_ITEMS_NOT_VALIDATED")));

        Cookie validateCsrf = fetchCsrfCookie();
        mockMvc.perform(patch("/api/admin/orders/{orderId}/items/{itemId}/batch-validation", orderId, itemId)
                        .session(adminSession)
                        .cookie(validateCsrf)
                        .header("X-XSRF-TOKEN", validateCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"validated": true}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].batchValidated", is(true)));

        // Unblocked now that the item's batch has been validated.
        updateStatus(adminSession, orderId, "READY");

        mockMvc.perform(get("/api/admin/orders").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].status".formatted(orderId), is(List.of("READY"))));
    }

    private void updateStatus(MockHttpSession adminSession, Integer orderId, String status) throws Exception {
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
