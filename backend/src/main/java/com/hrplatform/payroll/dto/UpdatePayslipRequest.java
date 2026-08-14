package com.hrplatform.payroll.dto;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class UpdatePayslipRequest {
    private BigDecimal bonus;
    private String notes;
}