package com.hrplatform.payroll.dto;

import com.hrplatform.employee.dto.EmployeeResponse;
import com.hrplatform.payroll.PayslipStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayslipResponse {
    private String id;
    private EmployeeResponse.EmployeeSummary employee;
    private String payMonth;
    private BigDecimal basicSalary;
    private BigDecimal hra;
    private BigDecimal conveyanceAllowance;
    private BigDecimal specialAllowance;
    private BigDecimal grossEarnings;
    private BigDecimal providentFund;
    private BigDecimal professionalTax;
    private BigDecimal unpaidLeaveDeduction;
    private BigDecimal bonus;
    private BigDecimal netSalary;
    private PayslipStatus status;
    private Instant generatedAt;
    private Instant paidAt;
    private String notes;
}