package ch.celestin.gyoza.security;

import ch.celestin.gyoza.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

import java.time.Instant;
import java.util.UUID;

/**
 * A single table backs both the email-verification and password-reset flows:
 * the two only differ by purpose and TTL, so splitting them into separate
 * entities would just duplicate the repository/service code.
 */
@Entity
@Table(name = "account_tokens")
public class AccountToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TokenPurpose purpose;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private Instant expiresAt;

    protected AccountToken() {
    }

    public AccountToken(String tokenHash, TokenPurpose purpose, User user, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.purpose = purpose;
        this.user = user;
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public TokenPurpose getPurpose() {
        return purpose;
    }

    public User getUser() {
        return user;
    }

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }
}
