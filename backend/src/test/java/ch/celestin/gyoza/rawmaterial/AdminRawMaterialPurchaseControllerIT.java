package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import java.util.List;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminRawMaterialPurchaseControllerIT extends AbstractIntegrationTest {

    @Test
    void getPurchases_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/raw-material-purchases"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createPurchase_asAdmin_persistsIt_andBecomesTheReferencePrice() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Integer rawMaterialId = createRawMaterial(adminSession, "Farine T55", "kg");

        Cookie csrfForPurchase = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/raw-material-purchases")
                        .session(adminSession)
                        .cookie(csrfForPurchase)
                        .header("X-XSRF-TOKEN", csrfForPurchase.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rawMaterialId": %d,
                                  "date": "2026-08-10",
                                  "quantityPurchased": 10,
                                  "totalPricePaid": 25,
                                  "source": "MANUAL",
                                  "originCountry": "Suisse",
                                  "store": "Coop",
                                  "batchNumber": "LOT-001"
                                }
                                """.formatted(rawMaterialId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rawMaterialId", is(rawMaterialId)))
                .andExpect(jsonPath("$.unitPrice", is(2.5)))
                .andExpect(jsonPath("$.originCountry", is("Suisse")))
                .andExpect(jsonPath("$.store", is("Coop")))
                .andExpect(jsonPath("$.batchNumber", is("LOT-001")));

        // The catalog now reflects this purchase's price as the reference cost.
        mockMvc.perform(get("/api/admin/raw-materials").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].referenceUnitPrice".formatted(rawMaterialId), is(List.of(2.5))))
                .andExpect(jsonPath("$[?(@.id == %d)].lastPurchaseDate".formatted(rawMaterialId), is(List.of("2026-08-10"))));
    }

    @Test
    void createPurchase_withoutBatchNumber_isAccepted() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Integer rawMaterialId = createRawMaterial(adminSession, "Gingembre frais", "kg");

        Cookie csrfForPurchase = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/raw-material-purchases")
                        .session(adminSession)
                        .cookie(csrfForPurchase)
                        .header("X-XSRF-TOKEN", csrfForPurchase.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rawMaterialId": %d,
                                  "date": "2026-08-11",
                                  "quantityPurchased": 3,
                                  "totalPricePaid": 9,
                                  "source": "SCANNED",
                                  "originCountry": "Chine",
                                  "store": "Marché"
                                }
                                """.formatted(rawMaterialId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchNumber").doesNotExist());
    }

    @Test
    void createPurchase_missingOriginCountry_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Integer rawMaterialId = createRawMaterial(adminSession, "Sauce soja", "L");

        Cookie csrfForPurchase = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/raw-material-purchases")
                        .session(adminSession)
                        .cookie(csrfForPurchase)
                        .header("X-XSRF-TOKEN", csrfForPurchase.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rawMaterialId": %d,
                                  "date": "2026-08-12",
                                  "quantityPurchased": 1,
                                  "totalPricePaid": 5,
                                  "source": "MANUAL",
                                  "originCountry": "",
                                  "store": "Coop"
                                }
                                """.formatted(rawMaterialId)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getPurchases_filteredByRawMaterial_returnsOnlyThatMaterialsHistory_mostRecentFirst() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        Integer rawMaterialId = createRawMaterial(adminSession, "Huile de sésame", "L");

        createPurchase(adminSession, rawMaterialId, "2026-08-01", "1", "10");
        createPurchase(adminSession, rawMaterialId, "2026-08-15", "1", "12");

        mockMvc.perform(get("/api/admin/raw-material-purchases")
                        .session(adminSession)
                        .param("rawMaterialId", rawMaterialId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].date", is("2026-08-15")))
                .andExpect(jsonPath("$[1].date", is("2026-08-01")));
    }

    private Integer createRawMaterial(MockHttpSession adminSession, String name, String unit) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        var result = mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"%s","unit":"%s"}
                                """.formatted(name, unit)))
                .andExpect(status().isOk())
                .andReturn();

        return JsonPath.read(result.getResponse().getContentAsString(), "$.id");
    }

    private void createPurchase(
            MockHttpSession adminSession,
            Integer rawMaterialId,
            String date,
            String quantity,
            String totalPrice
    ) throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/raw-material-purchases")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rawMaterialId": %d,
                                  "date": "%s",
                                  "quantityPurchased": %s,
                                  "totalPricePaid": %s,
                                  "source": "MANUAL",
                                  "originCountry": "Suisse",
                                  "store": "Coop"
                                }
                                """.formatted(rawMaterialId, date, quantity, totalPrice)))
                .andExpect(status().isOk());
    }
}
