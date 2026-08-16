package com.hrplatform.user;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.security.JwtService;
import com.hrplatform.security.RevokedToken;
import com.hrplatform.security.RevokedTokenRepository;
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
import com.hrplatform.security.RevokedToken;
import com.hrplatform.security.RevokedTokenRepository;

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
    private final com.hrplatform.email.EmailService emailService;
    private final com.hrplatform.config.AppProperties appProperties;
    private final RevokedTokenRepository revokedTokenRepository;
    private final EmployeeRepository employeeRepository;

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

    /**
     * Called right after a new User is created. If HR already has an
     * Employee record with this exact email, and nobody else has claimed
     * it yet, link the two automatically. This is what turns "create an
     * account" into "start using the product" without an admin having to
     * manually connect the two in the Accounts screen every time.
     */
    private void tryAutoLinkEmployee(User user) {
        employeeRepository.findByEmailIgnoreCaseAndDeletedFalse(user.getEmail())
                .filter(employee -> !userRepository.existsByEmployeeId(employee.getId()))
                .ifPresent(employee -> {
                    user.setEmployee(employee);
                    userRepository.save(user);
                    log.info("Auto-linked new account {} to employee {}", user.getEmail(), employee.getEmployeeCode());
                });
    }

        @Transactional
            public AuthResponse refresh(String refreshToken) {
                String email;
                String jti;
                try {
                    if (!"refresh".equals(jwtService.extractTokenType(refreshToken)) || jwtService.isExpired(refreshToken)) {
                        throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_EXPIRED, "Refresh token is invalid or expired.");
                    }
                    email = jwtService.extractEmail(refreshToken);
                    jti = jwtService.extractJti(refreshToken);
                } catch (JwtException | IllegalArgumentException e) {
                    throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Refresh token is invalid.");
                }

                if (jti != null && revokedTokenRepository.existsById(jti)) {
                    throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID,
                            "This refresh token has already been used or was revoked. Please log in again.");
                }

                User user = userRepository.findByEmailIgnoreCase(email)
                        .orElseThrow(() -> ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID, "Refresh token is invalid."));

                if (!user.isActive()) {
                    throw ApiException.forbidden(ErrorCode.ACCESS_DENIED, "This account has been deactivated.");
                }

                if (user.getTokensValidAfter() != null
                && jwtService.extractIssuedAt(refreshToken).toInstant().isBefore(user.getTokensValidAfter())) {
            throw ApiException.unauthorized(ErrorCode.AUTH_TOKEN_INVALID,
                    "Your session is no longer valid. Please log in again.");
        }

                // Rotation: the token just used is now single-use and gets revoked
                // immediately, whether or not anything goes wrong afterwards.
                if (jti != null) {
                    revokedTokenRepository.save(new RevokedToken(jti, jwtService.extractExpiry(refreshToken).toInstant()));
                }

                return issueTokens(user);
            }

            @Transactional
            public void logout(String refreshToken) {
                try {
                    String jti = jwtService.extractJti(refreshToken);
                    if (jti != null && !revokedTokenRepository.existsById(jti)) {
                        revokedTokenRepository.save(new RevokedToken(jti, jwtService.extractExpiry(refreshToken).toInstant()));
                    }
                } catch (JwtException | IllegalArgumentException e) {
                    // Already-invalid token: nothing to revoke, and logout should never fail
                    // client-side just because the token was already garbage.
                }
            }
/**
     * Generates a real, time-limited reset token and emails a working link
     * via Resend. Always returns the same response to the caller regardless
     * of whether the email exists, to avoid leaking account existence.
     */
    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (user == null) {
            return;
        }
        String token = generateSecureToken();
        user.setResetToken(token);
        user.setResetTokenExpiry(Instant.now().plusSeconds(RESET_TOKEN_VALID_MINUTES * 60));
        userRepository.save(user);

        String resetLink = appProperties.getFrontendUrl() + "/reset-password?token=" + token;
        String recipientName = user.getEmployee() != null ? user.getEmployee().getFullName() : user.getDisplayName();
        emailService.sendPasswordResetEmail(user.getEmail(), recipientName, resetLink);
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
        user.setTokensValidAfter(Instant.now());
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
         user.setTokensValidAfter(Instant.now());
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
