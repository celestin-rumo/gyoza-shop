package ch.celestin.gyoza.user;

import ch.celestin.gyoza.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AdminUserControllerIT extends AbstractIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void getUsers_withoutAuthentication_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getUsers_filteredByAdminRole_includesTheSeededAdmin_flaggedAsPrimary() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();

        mockMvc.perform(get("/api/admin/users")
                        .param("role", "ADMIN")
                        .session(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].email", hasItem("admin@example.com")))
                .andExpect(jsonPath("$[*].role", hasItem("ADMIN")))
                .andExpect(jsonPath("$[?(@.email=='admin@example.com')].primaryAdmin", hasItem(true)));
    }

    @Test
    void updateRole_promotesAnExistingCustomerToAdmin_andCanBeRevoked() throws Exception {
        String email = "customer.to.promote@example.com";
        userRepository.save(new User(
                email, passwordEncoder.encode("password123"), "Jean", "Dupont",
                "1 rue du Test", "1000", "Lausanne", Role.CUSTOMER, true
        ));

        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/users/role")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","role":"ADMIN"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("ADMIN")));

        Cookie csrfForRevoke = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/users/role")
                        .session(adminSession)
                        .cookie(csrfForRevoke)
                        .header("X-XSRF-TOKEN", csrfForRevoke.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","role":"CUSTOMER"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("CUSTOMER")));
    }

    @Test
    void updateRole_withAnUnknownEmail_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/users/role")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com","role":"ADMIN"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateRole_onOwnAccount_isRejected() throws Exception {
        MockHttpSession adminSession = loginAsAdmin();
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(put("/api/admin/users/role")
                        .session(adminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.com","role":"CUSTOMER"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateRole_onThePrimaryAdmin_isRejectedEvenByAnotherAdmin() throws Exception {
        String secondAdminEmail = "second.admin@example.com";
        userRepository.save(new User(
                secondAdminEmail, passwordEncoder.encode("password123"), "Alex", "Martin",
                "1 rue du Test", "1000", "Lausanne", Role.ADMIN, true
        ));

        Cookie csrfForLogin = fetchCsrfCookie();
        var loginResult = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfForLogin)
                        .header("X-XSRF-TOKEN", csrfForLogin.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(secondAdminEmail)))
                .andExpect(status().isOk())
                .andReturn();
        MockHttpSession secondAdminSession = (MockHttpSession) loginResult.getRequest().getSession();

        Cookie csrf = fetchCsrfCookie();
        mockMvc.perform(put("/api/admin/users/role")
                        .session(secondAdminSession)
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.com","role":"CUSTOMER"}
                                """))
                .andExpect(status().isBadRequest());
    }
}
