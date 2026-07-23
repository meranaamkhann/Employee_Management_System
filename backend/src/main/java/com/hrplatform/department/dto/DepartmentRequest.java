package com.hrplatform.department.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class DepartmentRequest {

    @NotBlank(message = "Department name is required")
    @Size(max = 100, message = "Department name must be under 100 characters")
    private String name;

    @Size(max = 1000, message = "Description must be under 1000 characters")
    private String description;

    private String headEmployeeId;

    @DecimalMin(value = "0.0", inclusive = true, message = "Budget cannot be negative")
    private BigDecimal budget;
}
