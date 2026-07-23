package com.hrplatform.employee;

import com.hrplatform.department.Department;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "employee", indexes = {
        @Index(name = "idx_employee_code", columnList = "employee_code", unique = true),
        @Index(name = "idx_employee_email", columnList = "email", unique = true),
        @Index(name = "idx_employee_department", columnList = "department_id"),
        @Index(name = "idx_employee_manager", columnList = "manager_id"),
        @Index(name = "idx_employee_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    /** Human-facing identifier, e.g. EMP-00042. Distinct from the internal UUID primary key. */
    @Column(name = "employee_code", nullable = false, unique = true, length = 20)
    private String employeeCode;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Gender gender;

    private LocalDate dateOfBirth;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Column(length = 100)
    private String designation;

    private LocalDate joiningDate;

    @Column(precision = 14, scale = 2)
    private BigDecimal salary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private EmploymentStatus status = EmploymentStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Column(length = 120)
    private String emergencyContactName;

    @Column(length = 20)
    private String emergencyContactPhone;

    @Column(length = 300)
    private String addressLine;

    @Column(length = 100)
    private String city;

    @Column(length = 100)
    private String country;

    @Column(length = 500)
    private String photoUrl;

    @Column(length = 2000)
    private String notes;

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;

    private Instant deletedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;

    @Version
    private Long version;
}
