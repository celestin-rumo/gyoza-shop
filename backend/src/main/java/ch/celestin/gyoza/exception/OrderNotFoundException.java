package ch.celestin.gyoza.exception;

public class OrderNotFoundException extends RuntimeException {

    public OrderNotFoundException(Long orderId) {
        super("Commande introuvable : " + orderId);
    }
}