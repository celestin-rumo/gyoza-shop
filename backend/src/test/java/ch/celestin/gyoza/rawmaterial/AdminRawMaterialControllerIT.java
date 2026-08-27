package ch.celestin.gyoza.rawmaterial;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminRawMaterialControllerIT extends AbstractIntegrationTest {

    @Test
    void getAllRawMaterials_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/raw-materials"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createRawMaterial_asAdmin_persistsIt_withNoReferencePriceYet() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Farine","unit":"kg"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Farine")))
                .andExpect(jsonPath("$.unit", is("kg")))
                .andExpect(jsonPath("$.referenceUnitPrice", nullValue()))
                .andExpect(jsonPath("$.lastPurchaseDate", nullValue()));

        mockMvc.perform(get("/api/admin/raw-materials").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Farine")));
    }

    @Test
    void createRawMaterial_rejectsDuplicateName() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Gingembre","unit":"kg"}
                                """))
                .andExpect(status().isOk());

        Cookie csrfForDuplicate = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrfForDuplicate)
                        .header("X-XSRF-TOKEN", csrfForDuplicate.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"gingembre","unit":"g"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void updateRawMaterial_asAdmin_changesNameAndUnit() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Sucre","unit":"kg"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer rawMaterialId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForUpdate = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/raw-materials/{id}", rawMaterialId)
                        .session(adminSession)
                        .cookie(csrfForUpdate)
                        .header("X-XSRF-TOKEN", csrfForUpdate.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Sucre roux","unit":"g"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Sucre roux")))
                .andExpect(jsonPath("$.unit", is("g")));
    }

    @Test
    void updateRawMaterial_unknownId_isNotFound() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/raw-materials/{id}", 999_999)
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Inconnu","unit":"kg"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code", is("RAW_MATERIAL_NOT_FOUND")));
    }

    @Test
    void deleteRawMaterial_withoutPurchases_removesIt() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Sel","unit":"kg"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer rawMaterialId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForDelete = fetchCsrfCookie();
        mockMvc.perform(delete("/api/admin/raw-materials/{id}", rawMaterialId)
                        .session(adminSession)
                        .cookie(csrfForDelete)
                        .header("X-XSRF-TOKEN", csrfForDelete.getValue()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/admin/raw-materials").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(rawMaterialId), hasSize(0)));
    }

    @Test
    void deleteRawMaterial_withPurchases_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/raw-materials")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Poivre","unit":"kg"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer rawMaterialId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForPurchase = fetchCsrfCookie();
        mockMvc.perform(post("/api/admin/raw-material-purchases")
                        .session(adminSession)
                        .cookie(csrfForPurchase)
                        .header("X-XSRF-TOKEN", csrfForPurchase.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "rawMaterialId": %d,
                                  "date": "2026-08-20",
                                  "quantityPurchased": 2,
                                  "totalPricePaid": 10,
                                  "source": "MANUAL",
                                  "originCountry": "Suisse",
                                  "store": "Coop",
                                  "batchNumber": null
                                }
                                """.formatted(rawMaterialId)))
                .andExpect(status().isOk());

        Cookie csrfForDelete = fetchCsrfCookie();
        mockMvc.perform(delete("/api/admin/raw-materials/{id}", rawMaterialId)
                        .session(adminSession)
                        .cookie(csrfForDelete)
                        .header("X-XSRF-TOKEN", csrfForDelete.getValue()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }
}
