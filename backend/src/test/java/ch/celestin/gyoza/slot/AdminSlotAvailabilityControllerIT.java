package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminSlotAvailabilityControllerIT extends AbstractIntegrationTest {

    @Test
    void createSlot_withoutAuthentication_isUnauthorized() throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/slots")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-01", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createSlot_thenClose_removesItFromThePublicOpenList_butKeepsItOnTheAdminList() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-02", "fulfillmentMethod": "PICKUP", "startTime": "14:00", "endTime": "16:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.open", is(true)))
                .andReturn();

        Integer slotId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        mockMvc.perform(get("/api/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(slotId), hasSize(1)));

        Cookie csrfForClose = fetchCsrfCookie();
        mockMvc.perform(patch("/api/admin/slots/{id}/status", slotId)
                        .session(adminSession)
                        .cookie(csrfForClose)
                        .header("X-XSRF-TOKEN", csrfForClose.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"open": false}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.open", is(false)));

        mockMvc.perform(get("/api/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(slotId), hasSize(0)));

        mockMvc.perform(get("/api/admin/slots").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(slotId), hasSize(1)));
    }

    @Test
    void createSlot_withStartTimeAfterEndTime_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-03", "fulfillmentMethod": "PICKUP", "startTime": "16:00", "endTime": "14:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void moveDate_updatesTheSlotDate_andIsReflectedOnThePublicEndpoint() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-04", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer slotId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForMove = fetchCsrfCookie();
        mockMvc.perform(patch("/api/admin/slots/{id}/date", slotId)
                        .session(adminSession)
                        .cookie(csrfForMove)
                        .header("X-XSRF-TOKEN", csrfForMove.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-11"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date", is("2027-03-11")));

        mockMvc.perform(get("/api/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)].date".formatted(slotId), hasSize(1)));
    }

    @Test
    void updateSlot_updatesAllFields_andIsReflectedOnThePublicEndpoint() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-06", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer slotId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForUpdate = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/slots/{id}", slotId)
                        .session(adminSession)
                        .cookie(csrfForUpdate)
                        .header("X-XSRF-TOKEN", csrfForUpdate.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-13", "fulfillmentMethod": "DELIVERY", "startTime": "18:00", "endTime": "20:00", "contentType": "FRESH"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date", is("2027-03-13")))
                .andExpect(jsonPath("$.fulfillmentMethod", is("DELIVERY")))
                .andExpect(jsonPath("$.startTime", is("18:00:00")))
                .andExpect(jsonPath("$.endTime", is("20:00:00")))
                .andExpect(jsonPath("$.contentType", is("FRESH")));

        mockMvc.perform(get("/api/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d && @.contentType == 'FRESH')]".formatted(slotId), hasSize(1)));
    }

    @Test
    void updateSlot_rejectsDuplicateDateMethodTimesAndContentType() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-07", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isOk());

        Cookie csrfForSecond = fetchCsrfCookie();
        var secondCreateResult = mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrfForSecond)
                        .header("X-XSRF-TOKEN", csrfForSecond.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-08", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer secondSlotId = JsonPath.read(
                secondCreateResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForUpdate = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/slots/{id}", secondSlotId)
                        .session(adminSession)
                        .cookie(csrfForUpdate)
                        .header("X-XSRF-TOKEN", csrfForUpdate.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-07", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code", is("INVALID_REQUEST")));
    }

    @Test
    void deleteSlot_removesItFromThePublicAndAdminLists() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        var createResult = mockMvc.perform(post("/api/admin/slots")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"date": "2027-03-05", "fulfillmentMethod": "PICKUP", "startTime": "10:00", "endTime": "12:00", "contentType": "FROZEN"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        Integer slotId = JsonPath.read(
                createResult.getResponse().getContentAsString(), "$.id"
        );

        Cookie csrfForDelete = fetchCsrfCookie();
        mockMvc.perform(delete("/api/admin/slots/{id}", slotId)
                        .session(adminSession)
                        .cookie(csrfForDelete)
                        .header("X-XSRF-TOKEN", csrfForDelete.getValue()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/slots"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(slotId), hasSize(0)));

        mockMvc.perform(get("/api/admin/slots").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == %d)]".formatted(slotId), hasSize(0)));
    }
}
