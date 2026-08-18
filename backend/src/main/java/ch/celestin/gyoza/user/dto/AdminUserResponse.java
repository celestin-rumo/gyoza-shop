package ch.celestin.gyoza.user.dto;

import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;

import java.util.UUID;

public record AdminUserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        Role role,
        boolean primaryAdmin
) {
    public static AdminUserResponse from(User user, boolean primaryAdmin) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                primaryAdmin
        );
    }
}
