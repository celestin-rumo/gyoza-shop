package ch.celestin.gyoza.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base class for controller integration tests: boots the full Spring context against a
 * real Postgres container and exposes MockMvc to drive HTTP requests through the real
 * security filter chain, controllers, services and JPA mappings — the layer unit tests
 * (mocked repositories) intentionally don't cover.
 *
 * <p>The container is started once in a static initializer (the "singleton container"
 * pattern) and never stopped explicitly — Testcontainers' Ryuk reaper kills it when the
 * JVM exits. Letting JUnit's {@code @Testcontainers}/{@code @Container} own the lifecycle
 * instead would stop the container after the first IT class's tests finish, while Spring's
 * test context cache keeps reusing the (now stale) {@code DataSource} it captured for every
 * later IT class, since they all share the same Spring configuration.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    @ServiceConnection
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17");

    static {
        POSTGRES.start();
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    /**
     * CSRF protection is on globally, so any state-changing request in a test
     * needs a token: GET any endpoint to have {@link ch.celestin.gyoza.security.CsrfCookieFilter}
     * write the XSRF-TOKEN cookie, then send that same value back as both the
     * cookie and the X-XSRF-TOKEN header (the double-submit pattern).
     */
    protected Cookie fetchCsrfCookie() throws Exception {
        return mockMvc.perform(get("/api/products"))
                .andReturn()
                .getResponse()
                .getCookie("XSRF-TOKEN");
    }

    /**
     * Logs in as the admin seeded by {@code DataInitializer} (default dev credentials from
     * application.yml — app.admin.email/password — unset in the test environment so the
     * fallback values apply) and returns the resulting session for reuse on later requests.
     */
    protected MockHttpSession loginAsAdmin() throws Exception {
        Cookie csrf = fetchCsrfCookie();

        var result = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@example.com","password":"changeme"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        return (MockHttpSession) result.getRequest().getSession();
    }
}
