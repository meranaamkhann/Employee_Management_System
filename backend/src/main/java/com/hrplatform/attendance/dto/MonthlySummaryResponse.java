package com.hrplatform.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class MonthlySummaryResponse {
    private String employeeId;
    private String employeeName;
    private String month; // e.g. "2026-08"
    private long presentDays;
    private long lateDays;
    private long halfDays;
    private long absentDays;
    private long onLeaveDays;
    private long totalRecorded;
}