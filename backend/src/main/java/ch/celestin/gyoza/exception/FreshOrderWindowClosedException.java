package ch.celestin.gyoza.exception;

public class FreshOrderWindowClosedException extends RuntimeException {

    public FreshOrderWindowClosedException() {
        super("La commande de gyozas frais est actuellement fermée.");
    }
}
