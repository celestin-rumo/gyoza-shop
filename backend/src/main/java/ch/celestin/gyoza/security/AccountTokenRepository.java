package ch.celestin.gyoza.security;

import ch.celestin.gyoza.user.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface AccountTokenRepository extends JpaRepository<AccountToken, UUID> {

    Optional<AccountToken> findByTokenHash(String tokenHash);

    void deleteByUserAndPurpose(User user, TokenPurpose purpose);
}
