package ch.celestin.gyoza.exception;

public class InvalidOrExpiredTokenException extends RuntimeException {

    public InvalidOrExpiredTokenException() {
        super("Lien invalide ou expiré");
    }
}
