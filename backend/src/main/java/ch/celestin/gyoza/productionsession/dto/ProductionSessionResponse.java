package ch.celestin.gyoza.productionsession.dto;

import java.time.LocalDate;
import java.util.List;

public record ProductionSessionResponse(
        Long id,
        LocalDate date,
        String batchNumber,
        String notes,
        List<RawMaterialUsageResponse> rawMaterialUsages,
        List<SessionParticipantResponse> participants,
        List<ProductOutputResponse> outputs
) {
}
