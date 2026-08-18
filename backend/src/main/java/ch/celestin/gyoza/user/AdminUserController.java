package ch.celestin.gyoza.user;

import ch.celestin.gyoza.security.GyozaUserDetails;
import ch.celestin.gyoza.user.dto.AdminUserResponse;
import ch.celestin.gyoza.user.dto.UpdateUserRoleRequest;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<AdminUserResponse> getUsers(@RequestParam(required = false) Role role) {
        return userService.getUsers(role);
    }

    @PutMapping("/role")
    public AdminUserResponse updateRole(
            @Valid @RequestBody UpdateUserRoleRequest request,
            @AuthenticationPrincipal GyozaUserDetails principal
    ) {
        return userService.updateRole(request.email(), principal.user().getEmail(), request.role());
    }
}
