package com.hrplatform.attendance;

import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {

    @Mock private AttendanceRepository attendanceRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private AttendanceService attendanceService;

    @Test
    void clockIn_rejectsSecondClockInSameDay() {
        when(attendanceRepository.findByEmployeeIdAndWorkDate(eq("emp-1"), any()))
                .thenReturn(Optional.of(new AttendanceRecord()));

        assertThatThrownBy(() -> attendanceService.clockIn("emp-1"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_CLOCKED_IN);

        verify(attendanceRepository, never()).save(any());
    }

    @Test
    void clockOut_rejectsWhenNeverClockedIn() {
        when(attendanceRepository.findByEmployeeIdAndWorkDate(eq("emp-1"), any()))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> attendanceService.clockOut("emp-1"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_CLOCKED_IN);
    }

    @Test
    void clockOut_rejectsSecondClockOutSameDay() {
        AttendanceRecord record = AttendanceRecord.builder()
                .clockIn(Instant.now().minusSeconds(3600))
                .clockOut(Instant.now())
                .status(AttendanceStatus.PRESENT)
                .build();
        when(attendanceRepository.findByEmployeeIdAndWorkDate(eq("emp-1"), any()))
                .thenReturn(Optional.of(record));

        assertThatThrownBy(() -> attendanceService.clockOut("emp-1"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_CLOCKED_OUT);
    }

    @Test
    void clockIn_createsRecordForToday() {
        Employee employee = new Employee();
        employee.setId("emp-1");
        employee.setFullName("Asad Khan");

        when(attendanceRepository.findByEmployeeIdAndWorkDate(eq("emp-1"), any())).thenReturn(Optional.empty());
        when(employeeRepository.findByIdAndDeletedFalse("emp-1")).thenReturn(Optional.of(employee));
        when(attendanceRepository.save(any(AttendanceRecord.class))).thenAnswer(inv -> {
            AttendanceRecord r = inv.getArgument(0);
            r.setId("att-1");
            return r;
        });

        attendanceService.clockIn("emp-1");

        verify(attendanceRepository).save(argThat(r ->
                r.getWorkDate().equals(LocalDate.now(java.time.ZoneId.of("Asia/Kolkata")))
                        && r.getClockIn() != null));
    }
}