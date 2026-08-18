package ch.celestin.gyoza.exception;

public class PackNotFoundException extends RuntimeException {

    public PackNotFoundException(Long packId) {
        super("Pack introuvable : " + packId);
    }
}