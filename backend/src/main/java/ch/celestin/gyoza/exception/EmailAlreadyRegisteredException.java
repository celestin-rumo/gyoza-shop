package ch.celestin.gyoza.exception;

public class EmailAlreadyRegisteredException extends RuntimeException {

    public EmailAlreadyRegisteredException() {
        super("Cette adresse email est déjà utilisée");
    }
}
