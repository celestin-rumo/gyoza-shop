package ch.celestin.gyoza.exception;

public class OrderItemsNotValidatedException
        extends RuntimeException {

    public OrderItemsNotValidatedException() {
        super(
                "Tous les numéros de lot doivent être vérifiés avant de passer la commande à Prête"
        );
    }
}
