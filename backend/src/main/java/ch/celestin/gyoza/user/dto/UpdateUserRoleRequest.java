package ch.celestin.gyoza.user.dto;

import ch.celestin.gyoza.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(

        @NotBlank
        @Email
        String email,

        @NotNull
        Role role

) {
}
