package ch.celestin.gyoza.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Credentials for the one ADMIN account seeded by {@link DataInitializer}
 * on first startup. Only consumed at seed time — after that, the admin
 * authenticates like any other {@code User} via email/password + session.
 */
@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(
        String email,
        String password
) {
}
