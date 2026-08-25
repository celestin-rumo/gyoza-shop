package ch.celestin.gyoza.productionsession.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SessionParticipantResponse(
        UUID userId,
        String userName,
        BigDecimal hoursSpent
) {
}
