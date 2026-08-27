package ch.celestin.gyoza.order;

import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.product.ProductRepository;
import ch.celestin.gyoza.slot.SlotAvailability;
import ch.celestin.gyoza.slot.SlotAvailabilityRepository;
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

import java.time.LocalDate;
import java.time.LocalTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

    @Autowired
    private SlotAvailabilityRepository slotAvailabilityRepository;

    @Test
    void createOrder_persistsIt_andDecrementsTheProductStock() throws Exception {
        LocalDate date = LocalDate.of(2027, 1, 5);
        seedOpenSlot(date, FulfillmentMethod.DELIVERY, ContentType.FROZEN);

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
                                  "date": "%s",
                                  "startTime": "18:00",
                                  "endTime": "20:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId(), date)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("RESERVED")))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.fulfillmentMethod", is("DELIVERY")))
                .andExpect(jsonPath("$.date", is(date.toString())))
                .andExpect(jsonPath("$.startTime", is("18:00:00")))
                .andExpect(jsonPath("$.endTime", is("20:00:00")))
                .andExpect(jsonPath("$.contentType", is("FROZEN")));

        Product reloaded = productRepository.findById(chicken.getId()).orElseThrow();
        assertThat(reloaded.getStockQuantity()).isEqualTo(stockBefore - 2 * sixPackOfChicken.getSize());
    }

    @Test
    void createOrder_withAnUnknownPack_isRejected() throws Exception {
        LocalDate date = LocalDate.of(2027, 1, 6);
        seedOpenSlot(date, FulfillmentMethod.DELIVERY, ContentType.FROZEN);

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
                                  "date": "%s",
                                  "startTime": "18:00",
                                  "endTime": "20:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(date)))
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
        LocalDate date = LocalDate.of(2027, 1, 7);
        seedOpenSlot(date, FulfillmentMethod.DELIVERY, ContentType.FROZEN);

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
                                  "date": "%s",
                                  "startTime": "18:00",
                                  "endTime": "20:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(email, sixPackOfChicken.getId(), date)))
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
                                  "date": "2027-01-08",
                                  "startTime": "18:00",
                                  "endTime": "20:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void createOrder_withStartTimeAfterEndTime_isRejected() throws Exception {
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
                                  "date": "2027-01-09",
                                  "startTime": "12:00",
                                  "endTime": "10:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void createOrder_withUnavailableSlot_isRejected() throws Exception {
        PackOption sixPackOfChicken = packOptionRepository.findAll().stream()
                .filter(pack -> pack.getSize() == 6 && pack.getProduct().getName().equals("Chicken"))
                .findFirst()
                .orElseThrow();

        Cookie csrf = fetchCsrfCookie();

        // No SlotAvailability row seeded for this exact date/method/time/content combination.
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
                                  "date": "2027-02-01",
                                  "startTime": "16:00",
                                  "endTime": "18:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SLOT_NOT_AVAILABLE")));
    }

    @Test
    void createOrder_withClosedSlot_isRejected() throws Exception {
        LocalDate date = LocalDate.of(2027, 2, 2);
        SlotAvailability slotAvailability = new SlotAvailability(
                date, FulfillmentMethod.PICKUP, LocalTime.of(14, 0), LocalTime.of(16, 0), ContentType.FROZEN
        );
        slotAvailability.close();
        slotAvailabilityRepository.save(slotAvailability);

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
                                  "date": "%s",
                                  "startTime": "14:00",
                                  "endTime": "16:00",
                                  "contentType": "FROZEN"
                                }
                                """.formatted(sixPackOfChicken.getId(), date)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SLOT_NOT_AVAILABLE")));
    }

    @Test
    void createOrder_whenNoSlotMatchesTheRequestedContentType_isRejected() throws Exception {
        LocalDate date = LocalDate.of(2027, 1, 10);
        // Only a FROZEN slot exists at this date/time/method — the request asks for FRESH.
        seedOpenSlot(date, FulfillmentMethod.PICKUP, ContentType.FROZEN);

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
                                  "date": "%s",
                                  "startTime": "10:00",
                                  "endTime": "12:00",
                                  "contentType": "FRESH"
                                }
                                """.formatted(sixPackOfChicken.getId(), date)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code", is("SLOT_NOT_AVAILABLE")));
    }

    @Test
    void createOrder_withFreshContentType_whenAvailableOnThatDate_succeeds() throws Exception {
        LocalDate date = LocalDate.of(2027, 1, 11);
        seedOpenSlot(date, FulfillmentMethod.PICKUP, ContentType.FRESH);

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
                                  "date": "%s",
                                  "startTime": "10:00",
                                  "endTime": "12:00",
                                  "contentType": "FRESH"
                                }
                                """.formatted(sixPackOfChicken.getId(), date)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.contentType", is("FRESH")));
    }

    private void seedOpenSlot(LocalDate date, FulfillmentMethod method, ContentType contentType) {
        if (method == FulfillmentMethod.DELIVERY) {
            slotAvailabilityRepository.save(new SlotAvailability(
                    date, method, LocalTime.of(18, 0), LocalTime.of(20, 0), contentType
            ));
        } else {
            slotAvailabilityRepository.save(new SlotAvailability(
                    date, method, LocalTime.of(10, 0), LocalTime.of(12, 0), contentType
            ));
        }
    }
}
