package com.hrplatform.attendance;

import com.hrplatform.attendance.dto.AttendanceResponse;
import com.hrplatform.attendance.dto.ManualAttendanceRequest;
import com.hrplatform.attendance.dto.MonthlySummaryResponse;
import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.common.PageResponse;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.employee.dto.EmployeeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    /** After this local time, a clock-in is marked LATE instead of PRESENT. */
    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);
    private static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    @Transactional
    public AttendanceResponse clockIn(String employeeId) {
        LocalDate today = LocalDate.now(ZONE);
        if (attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today).isPresent()) {
            throw ApiException.conflict(ErrorCode.ALREADY_CLOCKED_IN, "You have already clocked in today.");
        }

        Employee employee = employeeRepository.findByIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> ApiException.notFound("Employee not found."));

        Instant now = Instant.now();
        AttendanceStatus status = LocalTime.now(ZONE).isAfter(LATE_THRESHOLD)
                ? AttendanceStatus.LATE
                : AttendanceStatus.PRESENT;

        AttendanceRecord record = AttendanceRecord.builder()
                .employee(employee)
                .workDate(today)
                .clockIn(now)
                .status(status)
                .build();

        AttendanceRecord saved = attendanceRepository.save(record);
        auditService.record(AuditEntityType.ATTENDANCE, saved.getId(), AuditAction.CREATE,
                employee.getFullName() + " clocked in (" + status + ")");
        return toResponse(saved);
    }

    @Transactional
    public AttendanceResponse clockOut(String employeeId) {
        LocalDate today = LocalDate.now(ZONE);
        AttendanceRecord record = attendanceRepository.findByEmployeeIdAndWorkDate(employeeId, today)
                .orElseThrow(() -> ApiException.badRequest(ErrorCode.NOT_CLOCKED_IN,
                        "You haven't clocked in today."));

        if (record.getClockOut() != null) {
            throw ApiException.conflict(ErrorCode.ALREADY_CLOCKED_OUT, "You have already clocked out today.");
        }

        record.setClockOut(Instant.now());

        // Less than 5 hours between clock-in and clock-out -> half day.
        if (record.getClockIn() != null) {
            long hoursWorked = java.time.Duration.between(record.getClockIn(), record.getClockOut()).toHours();
            if (hoursWorked < 5 && record.getStatus() != AttendanceStatus.LATE) {
                record.setStatus(AttendanceStatus.HALF_DAY);
            }
        }

        AttendanceRecord saved = attendanceRepository.save(record);
        auditService.record(AuditEntityType.ATTENDANCE, saved.getId(), AuditAction.UPDATE,
                saved.getEmployee().getFullName() + " clocked out");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<AttendanceResponse> search(String employeeId, String departmentId, AttendanceStatus status,
                                                     LocalDate from, LocalDate to, String managerScopeId,
                                                     Pageable pageable) {
        Specification<AttendanceRecord> spec = Specification
                .where(AttendanceSpecifications.employeeId(employeeId))
                .and(AttendanceSpecifications.departmentId(departmentId))
                .and(AttendanceSpecifications.status(status))
                .and(AttendanceSpecifications.dateBetween(from, to))
                .and(AttendanceSpecifications.managerScope(managerScopeId));

        Page<AttendanceRecord> page = attendanceRepository.findAll(spec, pageable);
        List<AttendanceResponse> mapped = page.getContent().stream().map(this::toResponse).toList();
        return PageResponse.of(page, mapped);
    }

    @Transactional
    public AttendanceResponse createManual(ManualAttendanceRequest request) {
        Employee employee = employeeRepository.findByIdAndDeletedFalse(request.getEmployeeId())
                .orElseThrow(() -> ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "Employee not found."));

        if (attendanceRepository.findByEmployeeIdAndWorkDate(employee.getId(), request.getWorkDate()).isPresent()) {
            throw ApiException.conflict(ErrorCode.CONFLICT,
                    "An attendance record already exists for this employee on this date.");
        }

        AttendanceRecord record = AttendanceRecord.builder()
                .employee(employee)
                .workDate(request.getWorkDate())
                .clockIn(request.getClockIn())
                .clockOut(request.getClockOut())
                .status(request.getStatus())
                .notes(request.getNotes())
                .build();

        AttendanceRecord saved = attendanceRepository.save(record);
        auditService.record(AuditEntityType.ATTENDANCE, saved.getId(), AuditAction.CREATE,
                "Manually recorded attendance for " + employee.getFullName() + " on " + request.getWorkDate());
        return toResponse(saved);
    }

    @Transactional
    public AttendanceResponse update(String id, ManualAttendanceRequest request) {
        AttendanceRecord record = attendanceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Attendance record not found."));

        record.setClockIn(request.getClockIn());
        record.setClockOut(request.getClockOut());
        record.setStatus(request.getStatus());
        record.setNotes(request.getNotes());

        AttendanceRecord saved = attendanceRepository.save(record);
        auditService.record(AuditEntityType.ATTENDANCE, saved.getId(), AuditAction.UPDATE,
                "Corrected attendance for " + saved.getEmployee().getFullName() + " on " + saved.getWorkDate());
        return toResponse(saved);
    }

    @Transactional
    public void delete(String id) {
        AttendanceRecord record = attendanceRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Attendance record not found."));
        attendanceRepository.deleteById(id);
        auditService.record(AuditEntityType.ATTENDANCE, id, AuditAction.DELETE,
                "Deleted attendance record for " + record.getEmployee().getFullName() + " on " + record.getWorkDate());
    }

    @Transactional(readOnly = true)
    public MonthlySummaryResponse monthlySummary(String employeeId, YearMonth month) {
        Employee employee = employeeRepository.findByIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> ApiException.notFound("Employee not found."));

        LocalDate from = month.atDay(1);
        LocalDate to = month.atEndOfMonth();

        Map<AttendanceStatus, Long> counts = attendanceRepository.countGroupedByStatus(employeeId, from, to)
                .stream()
                .collect(java.util.stream.Collectors.toMap(
                        AttendanceRepository.StatusCount::getStatus,
                        AttendanceRepository.StatusCount::getRecordCount));

        long present = counts.getOrDefault(AttendanceStatus.PRESENT, 0L);
        long late = counts.getOrDefault(AttendanceStatus.LATE, 0L);
        long half = counts.getOrDefault(AttendanceStatus.HALF_DAY, 0L);
        long absent = counts.getOrDefault(AttendanceStatus.ABSENT, 0L);
        long leave = counts.getOrDefault(AttendanceStatus.ON_LEAVE, 0L);

        return MonthlySummaryResponse.builder()
                .employeeId(employeeId)
                .employeeName(employee.getFullName())
                .month(month.toString())
                .presentDays(present)
                .lateDays(late)
                .halfDays(half)
                .absentDays(absent)
                .onLeaveDays(leave)
                .totalRecorded(present + late + half + absent + leave)
                .build();
    }

    private AttendanceResponse toResponse(AttendanceRecord record) {
        return AttendanceResponse.builder()
                .id(record.getId())
                .employee(EmployeeResponse.EmployeeSummary.builder()
                        .id(record.getEmployee().getId())
                        .fullName(record.getEmployee().getFullName())
                        .employeeCode(record.getEmployee().getEmployeeCode())
                        .build())
                .workDate(record.getWorkDate())
                .clockIn(record.getClockIn())
                .clockOut(record.getClockOut())
                .status(record.getStatus())
                .notes(record.getNotes())
                .createdAt(record.getCreatedAt())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}