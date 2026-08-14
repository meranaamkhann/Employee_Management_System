package com.hrplatform.user;

import com.hrplatform.employee.Employee;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

/**
 * Login identity, deliberately separate from Employee (the HR profile).
 * Not every employee necessarily has login access, and the split keeps auth
 * concerns out of the employee domain model.
 */
@Entity
@Table(name = "app_user", indexes = {
        @Index(name = "idx_user_email", columnList = "email", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(nullable = false, unique = true)
    private String email;

    /**
     * Only meaningful when {@link #employee} is null — set at self-registration
     * so the account has a human-readable name before HR links (or creates) a
     * full Employee record for them. Once linked, the Employee's fullName is
     * the source of truth and this field is no longer read by the frontend.
     */
    private String displayName;
    private Instant tokensValidAfter;

    @Column(nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(nullable = false)
    @Builder.Default
    private boolean emailVerified = false;

    @OneToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    private String resetToken;
    private Instant resetTokenExpiry;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
