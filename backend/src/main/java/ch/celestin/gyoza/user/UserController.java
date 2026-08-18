package ch.celestin.gyoza.user;

import ch.celestin.gyoza.security.GyozaUserDetails;
import ch.celestin.gyoza.user.dto.UserResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/me")
    public UserResponse me(@AuthenticationPrincipal GyozaUserDetails principal) {
        return UserResponse.from(principal.user());
    }
}
