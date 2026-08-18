package ch.celestin.gyoza.user;

import ch.celestin.gyoza.config.AdminProperties;
import ch.celestin.gyoza.user.dto.AdminUserResponse;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final AdminProperties adminProperties;

    public UserServiceImpl(UserRepository userRepository, AdminProperties adminProperties) {
        this.userRepository = userRepository;
        this.adminProperties = adminProperties;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminUserResponse> getUsers(Role role) {
        List<User> users = role != null
                ? userRepository.findByRole(role)
                : userRepository.findAll();

        return users.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public AdminUserResponse updateRole(String targetEmail, String currentUserEmail, Role newRole) {
        String normalizedTarget = targetEmail.toLowerCase();

        if (normalizedTarget.equals(currentUserEmail.toLowerCase())) {
            throw new IllegalArgumentException("Impossible de modifier son propre rôle");
        }

        if (isPrimaryAdmin(normalizedTarget)) {
            throw new IllegalArgumentException(
                    "Impossible de modifier le rôle de l’administrateur principal"
            );
        }

        User user = userRepository.findByEmail(normalizedTarget)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucun compte avec cet email : " + targetEmail
                ));

        user.changeRole(newRole);

        return toResponse(user);
    }

    private AdminUserResponse toResponse(User user) {
        return AdminUserResponse.from(user, isPrimaryAdmin(user.getEmail()));
    }

    private boolean isPrimaryAdmin(String email) {
        return email.equalsIgnoreCase(adminProperties.email());
    }
}
