package com.hrplatform.department.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class DepartmentResponse {
    private String id;
    private String name;
    private String description;
    private String headEmployeeId;
    private String headEmployeeName;
    private BigDecimal budget;
    private long employeeCount;
    private Instant createdAt;
    private Instant updatedAt;
}
