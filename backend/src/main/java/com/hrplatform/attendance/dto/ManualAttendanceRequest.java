package com.hrplatform.attendance.dto;

import com.hrplatform.attendance.AttendanceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
public class ManualAttendanceRequest {

    @NotBlank
    private String employeeId;

    @NotNull
    private LocalDate workDate;

    private Instant clockIn;
    private Instant clockOut;

    @NotNull
    private AttendanceStatus status;

    private String notes;
}