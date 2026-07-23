package com.hrplatform.user.dto;

import com.hrplatform.user.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {
    @NotBlank
    @Email(message = "Email must be a valid address")
    private String email;

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#^()_\\-+=]).{8,}$",
        message = "Password must be at least 8 characters and include upper, lower, a number, and a symbol"
    )
    private String password;

    @NotNull(message = "Role is required")
    private UserRole role;

    private String employeeId;
}
