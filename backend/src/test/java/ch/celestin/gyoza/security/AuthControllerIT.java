package ch.celestin.gyoza.security;

import ch.celestin.gyoza.mail.MailService;
import ch.celestin.gyoza.support.AbstractIntegrationTest;
import ch.celestin.gyoza.user.User;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerIT extends AbstractIntegrationTest {

    @MockitoBean
    private MailService mailService;

    @Test
    void register_verify_login_and_me_roundTrip() throws Exception {
        String email = "marie.martin@example.com";

        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/auth/register")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"firstName":"Marie","lastName":"Martin","street":"1 rue du Test","postalCode":"1000","city":"Lausanne","email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isCreated());

        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(mailService).sendVerificationEmail(any(User.class), tokenCaptor.capture());
        String verificationToken = tokenCaptor.getValue();

        Cookie csrfForEarlyLogin = fetchCsrfCookie();
        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfForEarlyLogin)
                        .header("X-XSRF-TOKEN", csrfForEarlyLogin.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("ACCOUNT_NOT_VERIFIED")));

        mockMvc.perform(get("/api/auth/verify-email").param("token", verificationToken))
                .andExpect(status().isNoContent());

        Cookie csrfForLogin = fetchCsrfCookie();
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfForLogin)
                        .header("X-XSRF-TOKEN", csrfForLogin.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"password123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is(email)))
                .andExpect(jsonPath("$.role", is("CUSTOMER")))
                .andReturn();

        // MockMvc simulates sessions via MockHttpSession, not a real JSESSIONID
        // Set-Cookie header (that's the servlet container's job, not the app's) —
        // so session continuity across requests is carried by passing the session
        // object itself, not by reading a cookie off the response.
        MockHttpSession session = (MockHttpSession) loginResult.getRequest().getSession();

        mockMvc.perform(get("/api/users/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is(email)));
    }

    @Test
    void login_withWrongPassword_isRejected() throws Exception {
        Cookie csrf = fetchCsrfCookie();

        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com","password":"wrong-password"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("INVALID_CREDENTIALS")));
    }

    @Test
    void postWithoutCsrfToken_isRejected() throws Exception {
        // CSRF is rejected by the servlet filter chain, before Spring MVC's
        // DispatcherServlet — without a dedicated accessDeniedHandler this would
        // fall back to Spring Boot's generic {timestamp,status,error,path} body
        // instead of the app's ApiError shape the frontend actually reads.
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com","password":"whatever123"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code", is("CSRF_INVALID")))
                // Guards against writing this response with the servlet's default
                // ISO-8859-1 encoding instead of UTF-8, which mangles accents.
                .andExpect(jsonPath("$.message", is("Session invalide, merci de recharger la page et réessayer")));
    }

    @Test
    void me_whenNotAuthenticated_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/users/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code", is("UNAUTHENTICATED")));
    }
}
