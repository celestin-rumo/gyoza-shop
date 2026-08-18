package ch.celestin.gyoza.security;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AdminTokenStoreTest {

    private final AdminTokenStore tokenStore =
            new AdminTokenStore(new AdminProperties("admin", "changeme", 8));

    @Test
    void issue_returnsAValidToken() {
        String token = tokenStore.issue();

        assertThat(token).isNotBlank();
        assertThat(tokenStore.isValid(token)).isTrue();
    }

    @Test
    void isValid_returnsFalse_forUnknownToken() {
        assertThat(tokenStore.isValid("unknown-token")).isFalse();
    }

    @Test
    void revoke_invalidatesAPreviouslyIssuedToken() {
        String token = tokenStore.issue();

        tokenStore.revoke(token);

        assertThat(tokenStore.isValid(token)).isFalse();
    }

    @Test
    void isValid_returnsFalse_forAnAlreadyExpiredToken() {
        AdminTokenStore expiringImmediately =
                new AdminTokenStore(new AdminProperties("admin", "changeme", 0));

        String token = expiringImmediately.issue();

        assertThat(expiringImmediately.isValid(token)).isFalse();
    }
}
