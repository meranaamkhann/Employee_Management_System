package com.hrplatform.leave.dto;

import com.hrplatform.employee.dto.EmployeeResponse;
import com.hrplatform.leave.LeaveStatus;
import com.hrplatform.leave.LeaveType;
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
public class LeaveRequestResponse {
    private String id;
    private EmployeeResponse.EmployeeSummary employee;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private int numberOfDays;
    private String reason;
    private LeaveStatus status;
    private EmployeeResponse.EmployeeSummary reviewedBy;
    private String reviewNote;
    private Instant createdAt;
    private Instant updatedAt;
}