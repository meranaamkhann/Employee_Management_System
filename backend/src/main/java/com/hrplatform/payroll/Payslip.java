package com.hrplatform.payroll;

import com.hrplatform.employee.Employee;
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

@Entity
@Table(name = "payslip", indexes = {
        @Index(name = "idx_payslip_employee_month", columnList = "employee_id, pay_month", unique = true),
        @Index(name = "idx_payslip_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @Column(name = "pay_month", nullable = false, length = 7)
    private String payMonth; // "2026-08"

    @Column(name = "basic_salary", nullable = false)
    private BigDecimal basicSalary;
    @Column(nullable = false)
    private BigDecimal hra;
    @Column(name = "conveyance_allowance", nullable = false)
    private BigDecimal conveyanceAllowance;
    @Column(name = "special_allowance", nullable = false)
    private BigDecimal specialAllowance;
    @Column(name = "gross_earnings", nullable = false)
    private BigDecimal grossEarnings;

    @Column(name = "provident_fund", nullable = false)
    private BigDecimal providentFund;
    @Column(name = "professional_tax", nullable = false)
    private BigDecimal professionalTax;
    @Column(name = "unpaid_leave_deduction", nullable = false)
    @Builder.Default
    private BigDecimal unpaidLeaveDeduction = BigDecimal.ZERO;

    @Builder.Default
    private BigDecimal bonus = BigDecimal.ZERO;

    @Column(name = "net_salary", nullable = false)
    private BigDecimal netSalary;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private PayslipStatus status = PayslipStatus.DRAFT;

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private Instant generatedAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(length = 500)
    private String notes;

    @UpdateTimestamp
    private Instant updatedAt;

    @Version
    private Long version;
}