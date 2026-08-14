package com.hrplatform.leave;

import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.leave.dto.ApplyLeaveRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveServiceTest {

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private LeaveBalanceRepository leaveBalanceRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private LeaveService leaveService;

    private Employee employee() {
        Employee e = new Employee();
        e.setId("emp-1");
        e.setFullName("Asad Khan");
        return e;
    }

    @Test
    void apply_rejectsInvalidDateRange() {
        ApplyLeaveRequest req = new ApplyLeaveRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(LocalDate.of(2026, 8, 20));
        req.setEndDate(LocalDate.of(2026, 8, 18));

        assertThatThrownBy(() -> leaveService.apply("emp-1", req))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_DATE_RANGE);
    }

    @Test
    void apply_rejectsOverlappingRequest() {
        when(employeeRepository.findByIdAndDeletedFalse("emp-1")).thenReturn(Optional.of(employee()));
        when(leaveRequestRepository.findOverlapping(eq("emp-1"), any(), any()))
                .thenReturn(List.of(new LeaveRequest()));

        ApplyLeaveRequest req = new ApplyLeaveRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(LocalDate.of(2026, 8, 18));
        req.setEndDate(LocalDate.of(2026, 8, 20));

        assertThatThrownBy(() -> leaveService.apply("emp-1", req))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.OVERLAPPING_LEAVE_REQUEST);
    }

    @Test
    void apply_rejectsWhenBalanceInsufficient() {
        Employee employee = employee();
        when(employeeRepository.findByIdAndDeletedFalse("emp-1")).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.findOverlapping(eq("emp-1"), any(), any())).thenReturn(List.of());

        // Only 2 days remaining, but requesting a 5-day range
        LeaveBalance thin = LeaveBalance.builder().employee(employee).leaveType(LeaveType.CASUAL)
                .year(2026).allocatedDays(12).usedDays(10).build();
        when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear("emp-1", LeaveType.CASUAL, 2026))
                .thenReturn(Optional.of(thin));

        ApplyLeaveRequest req = new ApplyLeaveRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(LocalDate.of(2026, 8, 18));
        req.setEndDate(LocalDate.of(2026, 8, 22)); // 5 days

        assertThatThrownBy(() -> leaveService.apply("emp-1", req))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INSUFFICIENT_LEAVE_BALANCE);

        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    void apply_unpaidLeaveNeverChecksBalance() {
        Employee employee = employee();
        when(employeeRepository.findByIdAndDeletedFalse("emp-1")).thenReturn(Optional.of(employee));
        when(leaveRequestRepository.findOverlapping(eq("emp-1"), any(), any())).thenReturn(List.of());
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplyLeaveRequest req = new ApplyLeaveRequest();
        req.setLeaveType(LeaveType.UNPAID);
        req.setStartDate(LocalDate.of(2026, 8, 18));
        req.setEndDate(LocalDate.of(2026, 8, 25)); // 8 days, no balance exists at all

        leaveService.apply("emp-1", req);

        verify(leaveBalanceRepository, never()).findByEmployeeIdAndLeaveTypeAndYear(any(), any(), anyInt());
        verify(leaveRequestRepository).save(any());
    }

    @Test
    void managerApprove_rejectsWhenNotDirectManager() {
        Employee employee = employee();
        Employee otherManager = new Employee();
        otherManager.setId("mgr-2");
        employee.setManager(otherManager);

        LeaveRequest request = LeaveRequest.builder()
                .id("req-1").employee(employee).leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.now()).endDate(LocalDate.now())
                .numberOfDays(1).status(LeaveStatus.PENDING).build();

        when(leaveRequestRepository.findById("req-1")).thenReturn(Optional.of(request));

        assertThatThrownBy(() -> leaveService.approve("req-1", "mgr-1", true, new com.hrplatform.leave.dto.ReviewLeaveRequest()))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ACCESS_DENIED);
    }

    @Test
    void approve_deductsBalanceAndSetsStatus() {
        Employee employee = employee();
        LeaveRequest request = LeaveRequest.builder()
                .id("req-1").employee(employee).leaveType(LeaveType.CASUAL)
                .startDate(LocalDate.of(2026, 8, 18)).endDate(LocalDate.of(2026, 8, 19))
                .numberOfDays(2).status(LeaveStatus.PENDING).build();

        LeaveBalance balance = LeaveBalance.builder().employee(employee).leaveType(LeaveType.CASUAL)
                .year(2026).allocatedDays(12).usedDays(0).build();

        when(leaveRequestRepository.findById("req-1")).thenReturn(Optional.of(request));
        when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear("emp-1", LeaveType.CASUAL, 2026))
                .thenReturn(Optional.of(balance));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeRepository.findById(any())).thenReturn(Optional.of(employee));

        leaveService.approve("req-1", "emp-1", false, new com.hrplatform.leave.dto.ReviewLeaveRequest());

        assertThat(balance.getUsedDays()).isEqualTo(2);
        assertThat(request.getStatus()).isEqualTo(LeaveStatus.APPROVED);
    }
}