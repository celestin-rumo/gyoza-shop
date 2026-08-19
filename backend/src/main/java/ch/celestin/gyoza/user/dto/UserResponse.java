package ch.celestin.gyoza.user.dto;

import ch.celestin.gyoza.user.Role;
import ch.celestin.gyoza.user.User;

import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String street,
        String postalCode,
        String city,
        Role role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getStreet(),
                user.getPostalCode(),
                user.getCity(),
                user.getRole()
        );
    }
}
