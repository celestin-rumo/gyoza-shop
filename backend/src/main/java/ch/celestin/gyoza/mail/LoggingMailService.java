package ch.celestin.gyoza.mail;

import ch.celestin.gyoza.user.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnProperty(prefix = "app.mail", name = "provider", havingValue = "log", matchIfMissing = true)
public class LoggingMailService implements MailService {

    private static final Logger log = LoggerFactory.getLogger(LoggingMailService.class);

    private final MailProperties mailProperties;

    public LoggingMailService(MailProperties mailProperties) {
        this.mailProperties = mailProperties;
    }

    @Override
    public void sendVerificationEmail(User user, String rawToken) {
        log.info(
                "[mail:log] Verification email for {} -> {}/verify-email?token={}",
                user.getEmail(), mailProperties.frontendBaseUrl(), rawToken
        );
    }

    @Override
    public void sendPasswordResetEmail(User user, String rawToken) {
        log.info(
                "[mail:log] Password reset email for {} -> {}/reset-password?token={}",
                user.getEmail(), mailProperties.frontendBaseUrl(), rawToken
        );
    }
}
