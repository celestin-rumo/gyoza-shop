package ch.celestin.gyoza.productionsession.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record ProductionSessionResponse(
        Long id,
        LocalDate date,
        String batchNumber,
        BigDecimal durationHours,
        String notes,
        BigDecimal otherCosts,
        List<RawMaterialUsageResponse> rawMaterialUsages,
        List<SessionParticipantResponse> participants,
        List<ProductOutputResponse> outputs,
        ProductionSessionCostSummary costSummary,
        ProductionSessionActualSummary actualSummary
) {
}
