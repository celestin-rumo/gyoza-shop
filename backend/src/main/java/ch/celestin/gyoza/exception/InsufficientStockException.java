package ch.celestin.gyoza.exception;

public class InsufficientStockException extends RuntimeException {

    public InsufficientStockException(
            String productName,
            int requested,
            int available
    ) {
        super(
                "Stock insuffisant pour "
                        + productName
                        + ". Demandé : "
                        + requested
                        + ", disponible : "
                        + available
        );
    }
}