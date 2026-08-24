package ch.celestin.gyoza.exception;

public class SlotNotAvailableException extends RuntimeException {

    public SlotNotAvailableException() {
        super("Ce créneau n'est plus disponible pour la date choisie.");
    }
}
