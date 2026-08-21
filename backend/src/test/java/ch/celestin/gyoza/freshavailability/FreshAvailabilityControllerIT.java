package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FreshAvailabilityControllerIT extends AbstractIntegrationTest {

    @Test
    void getCurrent_isPubliclyAccessible() throws Exception {
        mockMvc.perform(get("/api/fresh-availability"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderWindowOpen").exists());
    }
}
