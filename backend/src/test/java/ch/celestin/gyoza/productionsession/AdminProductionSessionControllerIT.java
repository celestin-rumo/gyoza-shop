package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.rawmaterial.PurchaseSource;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import ch.celestin.gyoza.rawmaterial.RawMaterialPurchase;
import ch.celestin.gyoza.rawmaterial.RawMaterialPurchaseRepository;
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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminProductionSessionControllerIT extends AbstractIntegrationTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private RawMaterialRepository rawMaterialRepository;

    @Autowired
    private RawMaterialPurchaseRepository rawMaterialPurchaseRepository;

    @Autowired
    private PackOptionRepository packOptionRepository;

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
                                  "durationHours": 3.5,
                                  "notes": "Session du samedi",
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 3.5}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 80}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.notes", is("Session du samedi")))
                .andExpect(jsonPath("$.batchNumber", is("L20260820-01")))
                .andExpect(jsonPath("$.durationHours", is(3.5)))
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
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": 999999, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
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
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": []
                                }
                                """.formatted(rawMaterial.getId(), admin.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createSession_computesCostSummary_usingLastKnownPurchasePriceAndPackPrice() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        // Active while the session is created: unitSalePrice is only computed from an active
        // product's packs (see ProductionSessionServiceImpl.averageUnitSalePrice) and this test
        // asserts real revenue figures — deactivated below, once created, so it doesn't leak
        // into ProductControllerIT's assertion about the seeded catalog's exact size.
        Product chicken = productRepository.save(new Product("Poulet gyoza", 0));
        Product vegetable = productRepository.save(new Product("Légumes gyoza", 0));
        packOptionRepository.save(new PackOption(chicken, 1, new BigDecimal("2.00")));
        packOptionRepository.save(new PackOption(vegetable, 1, new BigDecimal("1.50")));

        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Farine T55", "kg"));
        rawMaterialPurchaseRepository.save(new RawMaterialPurchase(
                rawMaterial, LocalDate.of(2026, 1, 1), BigDecimal.TEN, new BigDecimal("10"),
                PurchaseSource.MANUAL, "Suisse", "Coop", null
        ));
        // Most recent purchase should win over the older one above.
        rawMaterialPurchaseRepository.save(new RawMaterialPurchase(
                rawMaterial, LocalDate.of(2026, 6, 1), BigDecimal.TEN, new BigDecimal("20"),
                PurchaseSource.MANUAL, "Suisse", "Coop", null
        ));

        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-23",
                                  "durationHours": 2,
                                  "otherCosts": 5,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 4, "targetProductId": %d}
                                  ],
                                  "participants": [
                                    {"userId": "%s"},
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 30},
                                    {"productId": %d, "quantityProduced": 10}
                                  ]
                                }
                                """.formatted(
                                rawMaterial.getId(), chicken.getId(),
                                admin.getId(), admin.getId(),
                                chicken.getId(), vegetable.getId()))
                )
                .andExpect(status().isOk())
                // Unit cost frozen from the latest purchase (2 CHF/kg), not the older one.
                .andExpect(jsonPath("$.rawMaterialUsages[0].unitCost", is(2.0)))
                .andExpect(jsonPath("$.rawMaterialUsages[0].lineCost", is(8.0)))
                .andExpect(jsonPath("$.rawMaterialUsages[0].targetProductId", is(chicken.getId().intValue())))
                // Targeted usage: full cost on chicken, none on vegetable.
                .andExpect(jsonPath("$.outputs[0].materialCost", is(8.0)))
                .andExpect(jsonPath("$.outputs[1].materialCost", is(0.0)))
                .andExpect(jsonPath("$.costSummary.totalMaterialCost", is(8.0)))
                .andExpect(jsonPath("$.costSummary.totalGyozaProduced", is(40)))
                .andExpect(jsonPath("$.costSummary.totalSessionHours", is(4.0)))
                // Revenue: 30 x 2.00 + 10 x 1.50 = 75; gross profit 75 - 8 = 67; net 67 - 5 = 62.
                .andExpect(jsonPath("$.costSummary.theoreticalRevenue", is(75.0)))
                .andExpect(jsonPath("$.costSummary.grossProfit", is(67.0)))
                .andExpect(jsonPath("$.costSummary.netProfit", is(62.0)))
                // Hourly revenue: net profit 62 / 4 person-hours = 15.5.
                .andExpect(jsonPath("$.costSummary.hourlyRevenue", is(15.5)));

        chicken.deactivate();
        productRepository.save(chicken);
        vegetable.deactivate();
        productRepository.save(vegetable);
    }

    @Test
    void updateOtherCosts_asAdmin_recomputesNetProfitAndHourlyRevenue() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Tofu gyoza", 5);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Tofu", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Integer sessionId = createSessionAndReturnId(adminSession, "2026-08-24", rawMaterial.getId(), admin.getId(), product.getId());

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(patch("/api/admin/production-sessions/{id}/other-costs", sessionId)
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"otherCosts": 3}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.otherCosts", is(3.0)))
                .andExpect(jsonPath("$.costSummary.otherCosts", is(3.0)));
    }

    @Test
    void updateOtherCosts_withNegativeValue_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Canard gyoza", 5);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Canard", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Integer sessionId = createSessionAndReturnId(adminSession, "2026-08-25", rawMaterial.getId(), admin.getId(), product.getId());

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(patch("/api/admin/production-sessions/{id}/other-costs", sessionId)
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"otherCosts": -1}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateSession_withZeroDuration_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Boeuf gyoza rec", 5);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Boeuf rec", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Integer sessionId = createSessionAndReturnId(adminSession, "2026-08-27", rawMaterial.getId(), admin.getId(), product.getId());

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/production-sessions/{id}", sessionId)
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "durationHours": 0,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 1}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), product.getId())))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateSession_asAdmin_replacesEverythingExceptDate() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product productA = saveInactiveProduct("Riz gyoza", 0);
        Product productB = saveInactiveProduct("Nouille gyoza", 0);
        RawMaterial rawMaterial1 = rawMaterialRepository.save(new RawMaterial("Riz", "kg"));
        RawMaterial rawMaterial2 = rawMaterialRepository.save(new RawMaterial("Nouilles", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie createCsrf = fetchCsrfCookie();
        var createResult = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(createCsrf)
                        .header("X-XSRF-TOKEN", createCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-28",
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 3}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 10}
                                  ]
                                }
                                """.formatted(rawMaterial1.getId(), admin.getId(), productA.getId())))
                .andExpect(status().isOk())
                .andReturn();

        Integer sessionId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.id");

        // Swap the raw material, keep the same participant, bump productA's quantity and add
        // productB as a brand-new output line.
        Cookie updateCsrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/production-sessions/{id}", sessionId)
                        .session(adminSession)
                        .cookie(updateCsrf)
                        .header("X-XSRF-TOKEN", updateCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "durationHours": 5,
                                  "notes": "Note modifiée",
                                  "otherCosts": 4,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 2}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 15},
                                    {"productId": %d, "quantityProduced": 8}
                                  ]
                                }
                                """.formatted(rawMaterial2.getId(), admin.getId(), productA.getId(), productB.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.durationHours", is(5.0)))
                .andExpect(jsonPath("$.notes", is("Note modifiée")))
                .andExpect(jsonPath("$.otherCosts", is(4.0)))
                .andExpect(jsonPath("$.rawMaterialUsages", hasSize(1)))
                .andExpect(jsonPath("$.rawMaterialUsages[0].rawMaterialName", is("Nouilles")))
                .andExpect(jsonPath("$.outputs", hasSize(2)));

        mockMvc.perform(get("/api/admin/products").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].stockQuantity".formatted(productA.getId()), is(List.of(15))))
                .andExpect(jsonPath("$[?(@.id == %d)].stockQuantity".formatted(productB.getId()), is(List.of(8))));
    }

    @Test
    void updateSession_reducingOutputQuantity_adjustsStockDownward() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product product = saveInactiveProduct("Canard gyoza rec", 0);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Canard rec", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Integer sessionId = createSessionAndReturnId(adminSession, "2026-08-29", rawMaterial.getId(), admin.getId(), product.getId());
        // createSessionAndReturnId produces quantityProduced 1 — bump it to 20 first so there's
        // room to reduce it meaningfully.
        Cookie bumpCsrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/production-sessions/{id}", sessionId)
                        .session(adminSession)
                        .cookie(bumpCsrf)
                        .header("X-XSRF-TOKEN", bumpCsrf.getValue())
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
                                """.formatted(rawMaterial.getId(), admin.getId(), product.getId())))
                .andExpect(status().isOk());

        Cookie reduceCsrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/production-sessions/{id}", sessionId)
                        .session(adminSession)
                        .cookie(reduceCsrf)
                        .header("X-XSRF-TOKEN", reduceCsrf.getValue())
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
                                    {"productId": %d, "quantityProduced": 5}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), product.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outputs[0].quantityProduced", is(5)));

        mockMvc.perform(get("/api/admin/products").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].stockQuantity".formatted(product.getId()), is(List.of(5))));
    }

    @Test
    void updateSession_removingAnOutputWithNoSales_removesItAndGivesBackStock() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Product keptProduct = saveInactiveProduct("Poulet gyoza rec", 0);
        Product droppedProduct = saveInactiveProduct("Dinde gyoza rec", 0);
        RawMaterial rawMaterial = rawMaterialRepository.save(new RawMaterial("Poulet rec", "kg"));
        User admin = userRepository.findByEmail("admin@example.com").orElseThrow();

        Cookie createCsrf = fetchCsrfCookie();
        var createResult = mockMvc.perform(post("/api/admin/production-sessions")
                        .session(adminSession)
                        .cookie(createCsrf)
                        .header("X-XSRF-TOKEN", createCsrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-08-30",
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 10},
                                    {"productId": %d, "quantityProduced": 5}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), keptProduct.getId(), droppedProduct.getId())))
                .andExpect(status().isOk())
                .andReturn();

        Integer sessionId = JsonPath.read(createResult.getResponse().getContentAsString(), "$.id");

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
                                    {"productId": %d, "quantityProduced": 10}
                                  ]
                                }
                                """.formatted(rawMaterial.getId(), admin.getId(), keptProduct.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.outputs", hasSize(1)))
                .andExpect(jsonPath("$.outputs[0].productName", is("Poulet gyoza rec")));

        mockMvc.perform(get("/api/admin/products").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].stockQuantity".formatted(droppedProduct.getId()), is(List.of(0))));
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
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 1}
                                  ]
                                }
                                """.formatted(date, rawMaterialId, userId, productId)))
                .andExpect(status().isOk());
    }

    private Integer createSessionAndReturnId(
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
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
                                  ],
                                  "outputs": [
                                    {"productId": %d, "quantityProduced": 1}
                                  ]
                                }
                                """.formatted(date, rawMaterialId, userId, productId)))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
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
                                  "durationHours": 2,
                                  "rawMaterialUsages": [
                                    {"rawMaterialId": %d, "quantityUsed": 1}
                                  ],
                                  "participants": [
                                    {"userId": "%s"}
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
