package ch.celestin.gyoza.security;

import ch.celestin.gyoza.security.dto.LoginRequest;
import ch.celestin.gyoza.security.dto.LoginResponse;
import jakarta.validation.Valid;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AdminProperties adminProperties;
    private final AdminTokenStore tokenStore;

    public AuthController(AdminProperties adminProperties, AdminTokenStore tokenStore) {
        this.adminProperties = adminProperties;
        this.tokenStore = tokenStore;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        boolean usernameMatches = constantTimeEquals(request.username(), adminProperties.username());
        boolean passwordMatches = constantTimeEquals(request.password(), adminProperties.password());

        if (!usernameMatches || !passwordMatches) {
            throw new BadCredentialsException("Identifiants invalides");
        }

        return new LoginResponse(tokenStore.issue());
    }

    private boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
                a.getBytes(StandardCharsets.UTF_8),
                b.getBytes(StandardCharsets.UTF_8)
        );
    }
}
