package com.hrplatform.user;

import com.hrplatform.common.ApiResponse;
import com.hrplatform.security.SecurityUtils;
import com.hrplatform.user.dto.CreateUserRequest;
import com.hrplatform.user.dto.UserResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Users", description = "Admin-only account management")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','IT_ADMIN')")
public class UserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(userService.listAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<UserResponse>> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Account created.", created));
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable String id) {
        userService.deactivate(id, SecurityUtils.currentUser().getUserId());
        return ResponseEntity.ok(ApiResponse.message("Account deactivated."));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<Void>> changeRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        UserRole newRole = UserRole.valueOf(body.get("role"));
        userService.changeRole(id, newRole, SecurityUtils.currentUser().getUserId());
        return ResponseEntity.ok(ApiResponse.message("Role updated."));
    }
}
