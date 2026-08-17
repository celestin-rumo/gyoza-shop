package ch.celestin.gyoza.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.admin")
public record AdminProperties(
        String username,
        String password,
        long tokenTtlHours
) {
}
