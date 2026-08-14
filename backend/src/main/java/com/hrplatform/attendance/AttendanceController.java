package com.hrplatform.attendance;

import com.hrplatform.attendance.dto.AttendanceResponse;
import com.hrplatform.attendance.dto.ManualAttendanceRequest;
import com.hrplatform.attendance.dto.MonthlySummaryResponse;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ApiResponse;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.common.PageResponse;
import com.hrplatform.security.SecurityUtils;
import com.hrplatform.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;

@Tag(name = "Attendance")
@RestController
@RequestMapping("/api/v1/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    @PostMapping("/clock-in")
    public ResponseEntity<ApiResponse<AttendanceResponse>> clockIn() {
        String employeeId = requireEmployeeId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Clocked in.", attendanceService.clockIn(employeeId)));
    }

    @PostMapping("/clock-out")
    public ResponseEntity<ApiResponse<AttendanceResponse>> clockOut() {
        String employeeId = requireEmployeeId();
        return ResponseEntity.ok(ApiResponse.ok("Clocked out.", attendanceService.clockOut(employeeId)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<AttendanceResponse>>> myHistory(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            Pageable pageable) {
        String employeeId = requireEmployeeId();
        return ResponseEntity.ok(ApiResponse.ok(
                attendanceService.search(employeeId, null, null, from, to, null, pageable)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<AttendanceResponse>>> search(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) AttendanceStatus status,
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            Pageable pageable) {

        UserPrincipal principal = SecurityUtils.currentUser();
        String managerScope = "MANAGER".equals(principal.getRole()) ? principal.getEmployeeId() : null;

        return ResponseEntity.ok(ApiResponse.ok(
                attendanceService.search(employeeId, departmentId, status, from, to, managerScope, pageable)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> createManual(@Valid @RequestBody ManualAttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Attendance recorded.", attendanceService.createManual(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> update(
            @PathVariable String id, @Valid @RequestBody ManualAttendanceRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Attendance updated.", attendanceService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        attendanceService.delete(id);
        return ResponseEntity.ok(ApiResponse.message("Attendance record deleted."));
    }

    @GetMapping("/summary/monthly")
    public ResponseEntity<ApiResponse<MonthlySummaryResponse>> monthlySummary(
            @RequestParam(required = false) String employeeId,
            @RequestParam String month) {

        UserPrincipal principal = SecurityUtils.currentUser();
        String targetEmployeeId = employeeId;

        if ("EMPLOYEE".equals(principal.getRole())) {
            targetEmployeeId = principal.getEmployeeId();
        } else if ("MANAGER".equals(principal.getRole()) && employeeId == null) {
            targetEmployeeId = principal.getEmployeeId();
        }

        if (targetEmployeeId == null) {
            throw ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "employeeId is required.");
        }

        return ResponseEntity.ok(ApiResponse.ok(
                attendanceService.monthlySummary(targetEmployeeId, YearMonth.parse(month))));
    }

    private String requireEmployeeId() {
        String employeeId = SecurityUtils.currentEmployeeId();
        if (employeeId == null) {
            throw ApiException.badRequest(ErrorCode.VALIDATION_FAILED,
                    "No employee profile is linked to this account.");
        }
        return employeeId;
    }
}