package ch.celestin.gyoza.security;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Jetons de session admin gardés en mémoire (une seule instance backend, pas de
 * persistance nécessaire : un redémarrage invalide simplement les sessions en cours).
 */
@Component
public class AdminTokenStore {

    private final SecureRandom random = new SecureRandom();
    private final Map<String, Instant> tokenExpiries = new ConcurrentHashMap<>();
    private final AdminProperties adminProperties;

    public AdminTokenStore(AdminProperties adminProperties) {
        this.adminProperties = adminProperties;
    }

    public String issue() {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        tokenExpiries.put(
                token,
                Instant.now().plusSeconds(adminProperties.tokenTtlHours() * 3600)
        );

        return token;
    }

    public boolean isValid(String token) {
        Instant expiry = tokenExpiries.get(token);

        if (expiry == null) {
            return false;
        }

        if (expiry.isBefore(Instant.now())) {
            tokenExpiries.remove(token);
            return false;
        }

        return true;
    }

    public void revoke(String token) {
        tokenExpiries.remove(token);
    }
}
