package com.hrplatform.payroll.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GeneratePayrollRequest {
    @NotBlank
    private String month; // "2026-08"
    private String employeeId; // null = generate for all active employees
}