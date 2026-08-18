package ch.celestin.gyoza.user;

import ch.celestin.gyoza.user.dto.AdminUserResponse;

import java.util.List;

public interface UserService {

    List<AdminUserResponse> getUsers(Role role);

    AdminUserResponse updateRole(String targetEmail, String currentUserEmail, Role newRole);
}
