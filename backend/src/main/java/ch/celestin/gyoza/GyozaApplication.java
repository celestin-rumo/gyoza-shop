package ch.celestin.gyoza;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration;

/**
 * Exclut l'auto-configuration d'un utilisateur en mémoire avec mot de passe généré :
 * l'authentification admin passe uniquement par le jeton opaque de {@code AdminTokenStore}.
 */
@SpringBootApplication(exclude = UserDetailsServiceAutoConfiguration.class)
public class GyozaApplication {

    public static void main(String[] args) {
        SpringApplication.run(GyozaApplication.class, args);
    }
}