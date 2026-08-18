package ch.celestin.gyoza.mail;

import ch.celestin.gyoza.user.User;

public interface MailService {

    void sendVerificationEmail(User user, String rawToken);

    void sendPasswordResetEmail(User user, String rawToken);
}
