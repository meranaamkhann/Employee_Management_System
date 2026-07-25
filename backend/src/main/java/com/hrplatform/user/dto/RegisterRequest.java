package com.hrplatform.user.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

/**
 * Public self-registration. Deliberately has no "role" field — every
 * self-registered account is provisioned as EMPLOYEE (see AuthService).
 * Elevating to HR/MANAGER/ADMIN/IT_ADMIN always requires an existing
 * ADMIN or IT_ADMIN acting through UserController, so nobody can grant
 * themselves elevated access by signing up.
 */
@Getter
@Setter
public class RegisterRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    private String email;

    @NotBlank(message = "Password is required")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_\\-+=]).{8,}$",
        message = "Password must be at least 8 characters and include upper, lower, a number, and a symbol"
    )
    private String password;
}
