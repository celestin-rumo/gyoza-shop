package ch.celestin.gyoza.productionsession.dto;

public record ProductOutputResponse(
        Long productId,
        String productName,
        int quantityProduced
) {
}
