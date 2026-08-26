package ch.celestin.gyoza.analytics;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AnalyticsControllerIT extends AbstractIntegrationTest {

    @Test
    void exportPdf_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/analytics/export/pdf"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void exportPdf_asAdmin_returnsAPdfAttachmentForTheRequestedRange() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        mockMvc.perform(get("/api/admin/analytics/export/pdf")
                        .param("startDate", "2026-08-01")
                        .param("endDate", "2026-08-03")
                        .session(adminSession))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"analytics_2026-08-01_2026-08-03.pdf\""));
    }

    @Test
    void exportPdf_withStartDateAfterEndDate_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        mockMvc.perform(get("/api/admin/analytics/export/pdf")
                        .param("startDate", "2026-08-10")
                        .param("endDate", "2026-08-01")
                        .session(adminSession))
                .andExpect(status().isBadRequest());
    }
}
