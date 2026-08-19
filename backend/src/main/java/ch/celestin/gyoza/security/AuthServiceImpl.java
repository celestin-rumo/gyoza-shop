package ch.celestin.gyoza.security;

import ch.celestin.gyoza.exception.EmailAlreadyRegisteredException;
import ch.celestin.gyoza.exception.InvalidOrExpiredTokenException;
import ch.celestin.gyoza.mail.MailService;
import ch.celestin.gyoza.security.dto.ForgotPasswordRequest;
import ch.celestin.gyoza.security.dto.RegisterRequest;
import ch.celestin.gyoza.security.dto.ResetPasswordRequest;
import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;
import ch.celestin.gyoza.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Duration EMAIL_VERIFICATION_TTL = Duration.ofHours(24);
    private static final Duration PASSWORD_RESET_TTL = Duration.ofHours(1);

    private final UserRepository userRepository;
    private final AccountTokenRepository accountTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final SecureRandom random = new SecureRandom();

    public AuthServiceImpl(
            UserRepository userRepository,
            AccountTokenRepository accountTokenRepository,
            PasswordEncoder passwordEncoder,
            MailService mailService
    ) {
        this.userRepository = userRepository;
        this.accountTokenRepository = accountTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.mailService = mailService;
    }

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        String email = request.email().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new EmailAlreadyRegisteredException();
        }

        User user = new User(
                email,
                passwordEncoder.encode(request.password()),
                request.firstName(),
                request.lastName(),
                request.street(),
                request.postalCode(),
                request.city(),
                Role.CUSTOMER,
                false
        );

        userRepository.save(user);

        String rawToken = issueToken(user, TokenPurpose.EMAIL_VERIFICATION, EMAIL_VERIFICATION_TTL);
        mailService.sendVerificationEmail(user, rawToken);
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmail(request.email().toLowerCase()).ifPresent(user -> {
            String rawToken = issueToken(user, TokenPurpose.PASSWORD_RESET, PASSWORD_RESET_TTL);
            mailService.sendPasswordResetEmail(user, rawToken);
        });
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        AccountToken accountToken = consumeToken(request.token(), TokenPurpose.PASSWORD_RESET);
        accountToken.getUser().changePassword(passwordEncoder.encode(request.newPassword()));
    }

    @Override
    @Transactional
    public void verifyEmail(String token) {
        AccountToken accountToken = consumeToken(token, TokenPurpose.EMAIL_VERIFICATION);
        accountToken.getUser().enable();
    }

    private String issueToken(User user, TokenPurpose purpose, Duration ttl) {
        accountTokenRepository.deleteByUserAndPurpose(user, purpose);

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        accountTokenRepository.save(new AccountToken(
                hash(rawToken),
                purpose,
                user,
                Instant.now().plus(ttl)
        ));

        return rawToken;
    }

    private AccountToken consumeToken(String rawToken, TokenPurpose purpose) {
        AccountToken accountToken = accountTokenRepository
                .findByTokenHash(hash(rawToken))
                .filter(token -> token.getPurpose() == purpose)
                .orElseThrow(InvalidOrExpiredTokenException::new);

        accountTokenRepository.delete(accountToken);

        if (accountToken.isExpired()) {
            throw new InvalidOrExpiredTokenException();
        }

        return accountToken;
    }

    private String hash(String rawToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(rawToken.getBytes(StandardCharsets.UTF_8));

            return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
