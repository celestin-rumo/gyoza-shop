package ch.celestin.gyoza.order;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.support.AbstractIntegrationTest;
import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OrderControllerIT extends AbstractIntegrationTest {

    @Autowired
    private PackOptionRepository packOptionRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createOrder_persistsIt_andDecrementsTheProductStock() throws Exception {
        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Product chicken = sixPackOfChicken.getProduct();
        int stockBefore = chicken.getStockQuantity();

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
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
                                  "lines": [{"packId": %d, "quantity": 2}],
                                  "fulfillmentMethod": "DELIVERY",
                                  "slot": "MARDI_18H_20H",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("RESERVED")))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.fulfillmentMethod", is("DELIVERY")))
                .andExpect(jsonPath("$.slot", is("MARDI_18H_20H")))
                .andExpect(jsonPath("$.contentType", is("FROZEN")));

        Product reloaded = productRepository.findById(chicken.getId()).orElseThrow();
        assertThat(reloaded.getStockQuantity()).isEqualTo(stockBefore - 2 * sixPackOfChicken.getSize());
    }

    @Test
    void createOrder_withAnUnknownPack_isRejected() throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
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
                                  "lines": [{"packId": 999999, "quantity": 1}],
                                  "fulfillmentMethod": "DELIVERY",
                                  "slot": "MARDI_18H_20H",
                                  "contentType": "FROZEN"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("PACK_NOT_FOUND")));
    }

    @Test
    void getMyOrders_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/orders/mine"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createOrder_whileLoggedIn_isLinkedToTheAccount_andAppearsInMyOrders() throws Exception {
        String email = "loyal.customer@example.com";
        userRepository.save(new User(
                email, passwordEncoder.encode("password123"), "Marie", "Martin",
                "1 rue du Test", "1000", "Lausanne", Role.CUSTOMER, true
        ));

        Cookie csrfForLogin = fetchCsrfCookie();
        var loginResult = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfForLogin)
                        .header("X-XSRF-TOKEN", csrfForLogin.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();

        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(post("/api/orders")
                        .session(session)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Marie",
                                    "lastName": "Martin",
                                    "email": "%s",
                                    "address": "1 rue du Test, Lausanne"
                                  },
                                  "lines": [{"packId": %d, "quantity": 1}],
                                  "fulfillmentMethod": "DELIVERY",
                                  "slot": "MARDI_18H_20H",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(email, sixPackOfChicken.getId())))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/orders/mine").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].customer.email", is(email)));
    }

    @Test
    void createOrder_withDeliveryAndMissingAddress_isRejected() throws Exception {
        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": ""
                                  },
                                  "lines": [{"packId": %d, "quantity": 1}],
                                  "fulfillmentMethod": "DELIVERY",
                                  "slot": "MARDI_18H_20H",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void createOrder_withMismatchedSlotForFulfillmentMethod_isRejected() throws Exception {
        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
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
                                  "lines": [{"packId": %d, "quantity": 1}],
                                  "fulfillmentMethod": "PICKUP",
                                  "slot": "MARDI_18H_20H",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void createOrder_withFreshContentType_whenWindowClosed_isRejected() throws Exception {
        // Explicitly close the window rather than relying on the V2 migration's default
        // seed value — test execution order across the class isn't guaranteed, and another
        // test (createOrder_withFreshContentType_whenWindowOpen_succeeds) opens it.
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrfForAdminUpdate = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/fresh-availability")
                        .session(adminSession)
                        .cookie(csrfForAdminUpdate)
                        .header("X-XSRF-TOKEN", csrfForAdminUpdate.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nextBatchDate": "2026-09-15", "orderWindowOpen": false}
                                """))
                .andExpect(status().isOk());

        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": ""
                                  },
                                  "lines": [{"packId": %d, "quantity": 1}],
                                  "fulfillmentMethod": "PICKUP",
                                  "slot": "SAMEDI_10H_12H",
                                  "contentType": "FRESH"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("FRESH_ORDER_WINDOW_CLOSED")));
    }

    @Test
    void createOrder_withFreshContentType_whenWindowOpen_succeeds() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrfForAdminUpdate = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/fresh-availability")
                        .session(adminSession)
                        .cookie(csrfForAdminUpdate)
                        .header("X-XSRF-TOKEN", csrfForAdminUpdate.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nextBatchDate": "2026-09-15", "orderWindowOpen": true}
                                """))
                .andExpect(status().isOk());

        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/orders")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "customer": {
                                    "firstName": "Jean",
                                    "lastName": "Dupont",
                                    "email": "jean.dupont@example.com",
                                    "address": ""
                                  },
                                  "lines": [{"packId": %d, "quantity": 1}],
                                  "fulfillmentMethod": "PICKUP",
                                  "slot": "SAMEDI_10H_12H",
                                  "contentType": "FRESH"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType", is("FRESH")));
    }
}
