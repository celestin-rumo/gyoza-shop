package ch.celestin.gyoza.exception;

public class RawMaterialNotFoundException extends RuntimeException {

    public RawMaterialNotFoundException(Long rawMaterialId) {
        super("Matière première introuvable : " + rawMaterialId);
    }
}
