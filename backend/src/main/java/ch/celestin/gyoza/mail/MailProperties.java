package ch.celestin.gyoza.mail;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.mail")
public record MailProperties(
        String provider,
        String fromAddress,
        String frontendBaseUrl
) {
}
