package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.rawmaterial.RawMaterialRepository;
import ch.celestin.gyoza.support.AbstractIntegrationTest;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminProductionSessionControllerIT extends AbstractIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void getAllSessions_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/production-sessions"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createSession_asAdmin_incrementsProductStock_viaProductAddStock() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Boeuf gyoza", 20);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Farine T55", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie csrf = fetchCsrfCookie();
        var result = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-20",
                                  "notes": "Session du samedi",
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 3.5}
                                  ],
                                  "participants": [
                                    {"userId": "%s", "hoursSpent": 4}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 80}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", is("Session du samedi")))
                .andExpect(jsonPath("$.batchNumber", is("L20260820-01")))
                .andExpect(jsonPath("$.rawMaterialUsages", hasSize(1)))
                .andExpect(jsonPath("$.rawMaterialUsages[0].rawMaterialName", is("Farine T55")))
                .andExpect(jsonPath("$.participants", hasSize(1)))
                .andExpect(jsonPath("$.participants[0].userName", is("Admin Gyoza")))
                .andExpect(jsonPath("$.outputs", hasSize(1)))
                .andExpect(jsonPath("$.outputs[0].productName", is("Boeuf gyoza")))
                .andExpect(jsonPath("$.outputs[0].quantityProduced", is(80)))
                .andReturn();

        Integer sessionId = JsonPath.read(result.getResponse().getContentAsString(), "$.id");

        // The stock mutation went through Product.addStock, not a duplicated code path.
        mockMvc.perform(get("/api/admin/products").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].stockQuantity".formatted(product.getId()), is(List.of(100))));

        mockMvc.perform(get("/api/admin/production-sessions/{id}", sessionId).session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(sessionId)))
                .andExpect(jsonPath("$.date", is("2026-08-20")));
    }

    @Test
    void createSession_withUnknownRawMaterial_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Porc gyoza", 10);
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-21",
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": 999999, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s", "hoursSpent": 2}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 10}
                                  ]
                                }
                                """.formatted(admin.getId(), product.getId())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("RAW_MATERIAL_NOT_FOUND")));

        // The transaction must have rolled back: no stock increment from the rejected session.
        mockMvc.perform(get("/api/admin/products").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].stockQuantity".formatted(product.getId()), is(List.of(10))));
    }

    @Test
    void createSession_withEmptyOutputs_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Gingembre", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-22",
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s", "hoursSpent": 2}
                                  ],
                                  "outputs": []
                                }
                                """.formatted(rawMaterial.getId(), admin.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getAllSessions_returnsThemOrderedByDateDescending() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Crevette gyoza", 5);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Crevettes", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        createSession(adminSession, "2026-01-05", rawMaterial.getId(), admin.getId(), product.getId());
        createSession(adminSession, "2026-06-15", rawMaterial.getId(), admin.getId(), product.getId());

        // Other tests in this class add sessions of their own to the same shared database, so
        // this asserts the relative order of these two dates rather than their absolute index.
        var result = mockMvc.perform(get("/api/admin/production-sessions").session(adminSession))
                .andExpect(status().isOk())
                .andReturn();

        List<String> dates = JsonPath.read(result.getResponse().getContentAsString(), "$[*].date");

        assertThat(dates.indexOf("2026-06-15")).isLessThan(dates.indexOf("2026-01-05"));
    }

    @Test
    void createSession_twiceOnTheSameDate_incrementsTheBatchNumberSequence() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Nouilles gyoza", 5);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Nouilles", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        String firstBatchNumber = createSessionAndReturnBatchNumber(
                adminSession, "2026-09-01", rawMaterial.getId(), admin.getId(), product.getId()
        );
        String secondBatchNumber = createSessionAndReturnBatchNumber(
                adminSession, "2026-09-01", rawMaterial.getId(), admin.getId(), product.getId()
        );

        assertThat(firstBatchNumber).isEqualTo("L20260901-01");
        assertThat(secondBatchNumber).isEqualTo("L20260901-02");
    }

    /**
     * Products created here are only used to assert stock increments through the admin
     * endpoint — kept inactive so they don't leak into the public catalog and break
     * {@code ProductControllerIT}'s assertions about the seeded catalog's exact size.
     */
    private Product saveInactiveProduct(String name, int initialStock) {
        Product product = new Product(name, initialStock);
        product.deactivate();
        return productRepository.save(product);
    }

    private void createSession(
            MockHttpSession adminSession,
            String date,
            Long rawMaterialId,
            UUID userId,
            Long productId
    ) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "%s",
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s", "hoursSpent": 2}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 1}
                                  ]
                                }
                                """.formatted(date, rawMaterialId, userId, productId)))
                .andExpect(status().isOk());
    }

    private String createSessionAndReturnBatchNumber(
            MockHttpSession adminSession,
            String date,
            Long rawMaterialId,
            UUID userId,
            Long productId
    ) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        var result = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "%s",
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s", "hoursSpent": 2}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 1}
                                  ]
                                }
                                """.formatted(date, rawMaterialId, userId, productId)))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.batchNumber");
    }
}
