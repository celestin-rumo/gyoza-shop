package ch.celestin.gyoza.exception;

public class ProductionSessionNotFoundException extends RuntimeException {

    public ProductionSessionNotFoundException(Long productionSessionId) {
        super("Session de production introuvable : " + productionSessionId);
    }
}
