package com.hrplatform.attendance.dto;

import com.hrplatform.attendance.AttendanceStatus;
import com.hrplatform.employee.dto.EmployeeResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private String id;
    private EmployeeResponse.EmployeeSummary employee;
    private LocalDate workDate;
    private Instant clockIn;
    private Instant clockOut;
    private AttendanceStatus status;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;
}