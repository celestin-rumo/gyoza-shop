package ch.celestin.gyoza;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Excludes the auto-configuration of an in-memory user with a generated password:
 * admin authentication relies solely on the opaque token from {@code AdminTokenStore}.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class GyozaApplication {

    public static void main(String[] args) {
        SpringApplication.run(GyozaApplication.class, args);
    }
}