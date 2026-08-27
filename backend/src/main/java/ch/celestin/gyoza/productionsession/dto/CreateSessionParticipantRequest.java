package ch.celestin.gyoza.productionsession.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateSessionParticipantRequest(

        @NotNull
        UUID userId

) {
}
