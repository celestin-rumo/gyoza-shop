package ch.celestin.gyoza.product;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminProductControllerIT extends AbstractIntegrationTest {

    @Test
    void getAllProducts_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/products"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createProduct_asAdmin_persistsIt() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/admin/products")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Beef","initialStock":50}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Beef")))
                .andExpect(jsonPath("$.stockQuantity", is(50)))
                .andExpect(jsonPath("$.active", is(true)));

        mockMvc.perform(get("/api/admin/products").session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem("Beef")));
    }
}
