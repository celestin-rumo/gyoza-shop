package ch.celestin.gyoza.mail;

import ch.celestin.gyoza.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Map;

@Service
@ConditionalOnProperty(prefix = "app.mail", name = "provider", havingValue = "resend")
public class ResendMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(ResendMailService.class);

    private final RestClient restClient;
    private final MailProperties mailProperties;

    public ResendMailService(
            MailProperties mailProperties,
            @Value("${RESEND_API_KEY:}") String apiKey
    ) {
        this.mailProperties = mailProperties;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public void sendVerificationEmail(User user, String rawToken) {
        String link = mailProperties.frontendBaseUrl() + "/verify-email?token=" + rawToken;

        send(
                user.getEmail(),
                "Confirme ton adresse email",
                "<p>Bienvenue chez Gyoza Shop ! Clique ici pour confirmer ton adresse email :</p>"
                        + "<p><a href=\"" + link + "\">" + link + "</a></p>"
        );
    }

    @Override
    public void sendPasswordResetEmail(User user, String rawToken) {
        String link = mailProperties.frontendBaseUrl() + "/reset-password?token=" + rawToken;

        send(
                user.getEmail(),
                "Réinitialise ton mot de passe",
                "<p>Clique ici pour choisir un nouveau mot de passe (lien valable 1 heure) :</p>"
                        + "<p><a href=\"" + link + "\">" + link + "</a></p>"
        );
    }

    private void send(String to, String subject, String html) {
        // Best-effort: a delivery failure (unverified domain, Resend outage,
        // rate limit...) must never roll back the account action that
        // triggered it — registration/password-reset already succeeded from
        // the user's point of view by the time we get here.
        try {
            restClient.post()
                    .uri("/emails")
                    .body(Map.of(
                            "from", mailProperties.fromAddress(),
                            "to", to,
                            "subject", subject,
                            "html", html
                    ))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.error("Failed to send email to {} via Resend: {}", to, e.getMessage());
        }
    }
}
