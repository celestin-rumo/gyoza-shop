package ch.celestin.gyoza.order.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateItemBatchValidationRequest(

        @NotNull
        Boolean validated

) {
}
