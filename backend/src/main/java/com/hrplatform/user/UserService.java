package com.hrplatform.user;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.user.dto.CreateUserRequest;
import com.hrplatform.user.dto.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return userRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw ApiException.conflict(ErrorCode.DUPLICATE_EMAIL, "An account with this email already exists.");
        }

        Employee employee = null;
        if (request.getEmployeeId() != null) {
            employee = employeeRepository.findByIdAndDeletedFalse(request.getEmployeeId())
                    .orElseThrow(() -> ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "Selected employee does not exist."));
        }

        User user = User.builder()
                .email(request.getEmail().trim().toLowerCase())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .active(true)
                .emailVerified(false)
                .employee(employee)
                .build();

        User saved = userRepository.save(user);
        auditService.record(AuditEntityType.USER_ACCOUNT, saved.getId(), AuditAction.CREATE,
                "Created account " + saved.getEmail() + " with role " + saved.getRole());
        return toResponse(saved);
    }

    @Transactional
    public void deactivate(String userId, String requestingUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Account not found."));

        if (userId.equals(requestingUserId)) {
            throw ApiException.forbidden(ErrorCode.SELF_DELETE_FORBIDDEN, "You cannot deactivate your own account.");
        }

        if (user.getRole() == UserRole.ADMIN
                && user.isActive()
                && userRepository.countByRoleAndActiveTrue(UserRole.ADMIN) <= 1) {
            throw ApiException.forbidden(ErrorCode.LAST_ADMIN_FORBIDDEN,
                    "At least one active admin account must remain.");
        }

        user.setActive(false);
        userRepository.save(user);
        auditService.record(AuditEntityType.USER_ACCOUNT, user.getId(), AuditAction.DEACTIVATE,
                "Deactivated account " + user.getEmail());
    }

    @Transactional
    public void changeRole(String userId, UserRole newRole, String requestingUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Account not found."));

        boolean demotingLastAdmin = user.getRole() == UserRole.ADMIN
                && newRole != UserRole.ADMIN
                && userRepository.countByRoleAndActiveTrue(UserRole.ADMIN) <= 1;

        if (demotingLastAdmin) {
            throw ApiException.forbidden(ErrorCode.LAST_ADMIN_FORBIDDEN,
                    "At least one active admin account must remain.");
        }

        UserRole previousRole = user.getRole();
        user.setRole(newRole);
        userRepository.save(user);
        auditService.record(AuditEntityType.USER_ACCOUNT, user.getId(), AuditAction.ROLE_CHANGE,
                "Changed " + user.getEmail() + " from " + previousRole + " to " + newRole);
    }

    private UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .role(user.getRole())
                .active(user.isActive())
                .emailVerified(user.isEmailVerified())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .employeeName(user.getEmployee() != null ? user.getEmployee().getFullName() : null)
                .displayName(user.getDisplayName())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
