package ch.celestin.gyoza.security;

import ch.celestin.gyoza.security.dto.ForgotPasswordRequest;
import ch.celestin.gyoza.security.dto.RegisterRequest;
import ch.celestin.gyoza.security.dto.ResetPasswordRequest;

public interface AuthService {

    void register(RegisterRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void verifyEmail(String token);
}
