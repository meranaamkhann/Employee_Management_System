package com.hrplatform.user;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.security.JwtService;
import com.hrplatform.security.SecurityUtils;
import com.hrplatform.user.dto.AuthResponse;
import com.hrplatform.user.dto.LoginRequest;
import com.hrplatform.user.dto.RegisterRequest;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long RESET_TOKEN_VALID_MINUTES = 30;

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> ApiException.unauthorized(ErrorCode.INVALID_CREDENTIALS, "Email or password is incorrect."));

        if (!user.isActive()) {
            throw ApiException.forbidden(ErrorCode.ACCESS_DENIED, "This account has been deactivated.");
        }

        auditService.record(AuditEntityType.USER_ACCOUNT, user.getId(), AuditAction.LOGIN, "Signed in");
        return issueTokens(user);
    }

    /**
     * Public self-registration. Always creates an EMPLOYEE-role account with
     * no linked Employee record — HR/ADMIN link (or create) the actual HR
     * profile later. This keeps the employee directory and payroll totals
     * accurate (nobody can inject themselves into headcount/salary stats by
     * signing up) while still letting people create their own login.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw ApiException.conflict(ErrorCode.DUPLICATE_EMAIL, "An account with this email already exists.");
        }

        User user = User.builder()
                .email(email)
                .displayName(request.getFullName().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.EMPLOYEE)
                .active(true)
                .emailVerified(false)
                .build();

        User saved = userRepository.save(user);
        auditService.record(AuditEntityType.USER_ACCOUNT, saved.getId(), AuditAction.CREATE,
                "Self-registered as " + saved.getEmail());
        return issueTokens(saved);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        String email;
        try {
            if (!"refresh".equals(jwtService.extractTokenType(refreshToken)) || jwtService.isExpired(refreshToken)) {
                throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_EXPIRED, "Refresh token is invalid or expired.");
            }
            email = jwtService.extractEmail(refreshToken);
        } catch (JwtException | IllegalArgumentException e) {
            throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Refresh token is invalid.");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Refresh token is invalid."));

        if (!user.isActive()) {
            throw ApiException.forbidden(ErrorCode.ACCESS_DENIED, "This account has been deactivated.");
        }

        return issueTokens(user);
    }

    /**
     * Mock email verification flow: in a real deployment this would dispatch
     * an email via an SMTP/SES provider. Here the reset token is generated
     * and returned directly so the flow can be exercised end-to-end without
     * external infrastructure. Swap this method's return for a mailer call
     * to go to production.
     */
    @Transactional
    public String forgotPassword(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            // Deliberately don't reveal whether the email exists.
            return null;
        }
        String token = generateSecureToken();
        user.setResetToken(token);
        user.setResetTokenExpiry(Instant.now().plusSeconds(RESET_TOKEN_VALID_MINUTES * 60));
        userRepository.save(user);
        log.info("[MOCK EMAIL] Password reset link for {}: /reset-password?token={}", email, token);
        return token;
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "Reset token is invalid."));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "Reset token has expired.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    /**
     * Authenticated in-session password change — distinct from the
     * forgot/reset flow, which is for people who are locked out. Requires
     * the current password so a hijacked, still-logged-in session can't be
     * used to permanently lock the real owner out.
     */
    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        var principal = SecurityUtils.currentUser();
        if (principal == null) {
            throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Not authenticated.");
        }

        User user = userRepository.findByEmailIgnoreCase(principal.getEmail())
                .orElseThrow(() -> ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Account not found."));

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            throw ApiException.badRequest(ErrorCode.INVALID_CREDENTIALS, "Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateAccessToken(user.getEmail(), user.getId(), user.getRole().name());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail(), user.getId());
        String displayName = user.getEmployee() != null ? user.getEmployee().getFullName() : user.getDisplayName();
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .email(user.getEmail())
                .role(user.getRole().name())
                .employeeId(user.getEmployee() != null ? user.getEmployee().getId() : null)
                .displayName(displayName)
                .build();
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
