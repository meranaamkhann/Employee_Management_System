package com.hrplatform.user.dto;

import com.hrplatform.user.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String email;
    private UserRole role;
    private boolean active;
    private boolean emailVerified;
    private String employeeId;
    private String employeeName;
    private Instant createdAt;
}
