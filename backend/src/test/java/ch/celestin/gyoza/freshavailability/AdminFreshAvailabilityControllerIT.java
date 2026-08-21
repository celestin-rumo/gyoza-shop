package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminFreshAvailabilityControllerIT extends AbstractIntegrationTest {

    @Test
    void update_withoutAuthentication_isUnauthorized() throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/fresh-availability")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nextBatchDate": "2026-09-15", "orderWindowOpen": true}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void update_asAdmin_persistsTheChange_andIsReflectedOnThePublicEndpoint() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/fresh-availability")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nextBatchDate": "2026-10-01", "orderWindowOpen": true}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextBatchDate", is("2026-10-01")))
                .andExpect(jsonPath("$.orderWindowOpen", is(true)));

        mockMvc.perform(get("/api/fresh-availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextBatchDate", is("2026-10-01")))
                .andExpect(jsonPath("$.orderWindowOpen", is(true)));
    }
}
