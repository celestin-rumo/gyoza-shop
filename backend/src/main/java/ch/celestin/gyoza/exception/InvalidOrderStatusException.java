package ch.celestin.gyoza.exception;

import ch.celestin.gyoza.order.OrderStatus;

public class InvalidOrderStatusException
        extends RuntimeException {

    public InvalidOrderStatusException(
            OrderStatus current,
            OrderStatus requested
    ) {
        super(
                "Cannot change order status from "
                        + current
                        + " to "
                        + requested
        );
    }
}