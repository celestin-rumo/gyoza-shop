package ch.celestin.gyoza.rawmaterial.dto;

import jakarta.validation.constraints.NotBlank;

public record UpdateRawMaterialRequest(

        @NotBlank
        String name,

        @NotBlank
        String unit

) {
}
