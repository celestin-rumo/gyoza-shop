package ch.celestin.gyoza.pack.dto;

import java.math.BigDecimal;

public record PackResponse(
        Long id,
        int size,
        BigDecimal price
) {
}