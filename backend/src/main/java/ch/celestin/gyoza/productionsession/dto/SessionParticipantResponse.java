package ch.celestin.gyoza.productionsession.dto;

import java.util.UUID;

public record SessionParticipantResponse(
        UUID userId,
        String userName
) {
}
