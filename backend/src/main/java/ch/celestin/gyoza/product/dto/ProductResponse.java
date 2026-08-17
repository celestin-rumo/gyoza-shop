package ch.celestin.gyoza.product.dto;

import ch.celestin.gyoza.pack.dto.PackResponse;

import java.util.List;

public record ProductResponse(
        Long id,
        String name,
        int stockQuantity,
        boolean active,
        List<PackResponse> packs
) {
}