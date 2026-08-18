package ch.celestin.gyoza.exception;

import ch.celestin.gyoza.order.OrderStatus;

public class InvalidOrderStatusException
        extends RuntimeException {

    public InvalidOrderStatusException(
            OrderStatus current,
            OrderStatus requested
    ) {
        super(
                "Impossible de changer le statut de la commande de "
                        + current
                        + " à "
                        + requested
        );
    }
}