package ch.celestin.gyoza.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

        @NotBlank
        String firstName,

        @NotBlank
        String lastName,

        @NotBlank
        String street,

        @NotBlank
        String postalCode,

        @NotBlank
        String city,

        @NotBlank
        @Email
        String email,

        @NotBlank
        @Size(min = 8)
        String password

) {
}
