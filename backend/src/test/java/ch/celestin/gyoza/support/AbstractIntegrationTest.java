package ch.celestin.gyoza.support;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;

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
}
