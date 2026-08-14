package com.hrplatform.payroll;

import com.hrplatform.attendance.AttendanceRepository;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.leave.LeaveRequestRepository;
import com.hrplatform.payroll.dto.GeneratePayrollRequest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {

    @Mock private PayslipRepository payslipRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private AttendanceRepository attendanceRepository;
    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private AuditService auditService;

    @InjectMocks
    private PayrollService payrollService;

    @Test
    void generate_splitsGrossIntoCorrectComponents() {
        Employee employee = new Employee();
        employee.setId("emp-1");
        employee.setFullName("Asad Khan");
        employee.setSalary(new BigDecimal("50000"));

        when(employeeRepository.findByIdAndDeletedFalse("emp-1")).thenReturn(Optional.of(employee));
        when(payslipRepository.findByEmployeeIdAndPayMonth("emp-1", "2026-08")).thenReturn(Optional.empty());
        when(leaveRequestRepository.sumApprovedUnpaidDays(eq("emp-1"), any(), any())).thenReturn(0);
        when(attendanceRepository.countGroupedByStatus(eq("emp-1"), any(), any())).thenReturn(List.of());
        when(payslipRepository.save(any(Payslip.class))).thenAnswer(inv -> inv.getArgument(0));

        GeneratePayrollRequest request = new GeneratePayrollRequest();
        request.setMonth("2026-08");
        request.setEmployeeId("emp-1");

        var result = payrollService.generate(request);

        assertThat(result).hasSize(1);
        var payslip = result.get(0);
        assertThat(payslip.getBasicSalary()).isEqualByComparingTo("25000.00");  // 50% of 50000
        assertThat(payslip.getHra()).isEqualByComparingTo("10000.00");          // 20%
        assertThat(payslip.getConveyanceAllowance()).isEqualByComparingTo("1600.00"); // capped, not 10% (5000)
        assertThat(payslip.getProvidentFund()).isEqualByComparingTo("1800.00"); // capped at 1800, not 12% of 25000 (3000)
    }

    @Test
    void generate_skipsEmployeeAlreadyHavingPayslipForMonth() {
        Employee employee = new Employee();
        employee.setId("emp-1");
        employee.setSalary(new BigDecimal("50000"));

        when(employeeRepository.findByIdAndDeletedFalse("emp-1")).thenReturn(Optional.of(employee));
        when(payslipRepository.findByEmployeeIdAndPayMonth("emp-1", "2026-08"))
                .thenReturn(Optional.of(new Payslip()));

        GeneratePayrollRequest request = new GeneratePayrollRequest();
        request.setMonth("2026-08");
        request.setEmployeeId("emp-1");

        var result = payrollService.generate(request);

        assertThat(result).isEmpty();
        verify(payslipRepository, never()).save(any());
    }

    @Test
    void update_rejectsEditingFinalizedPayslip() {
        Payslip payslip = Payslip.builder().id("p-1").status(PayslipStatus.FINALIZED).build();
        when(payslipRepository.findById("p-1")).thenReturn(Optional.of(payslip));

        var request = new com.hrplatform.payroll.dto.UpdatePayslipRequest();
        request.setBonus(new BigDecimal("1000"));

        assertThatThrownBy(() -> payrollService.update("p-1", request))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYSLIP_LOCKED);
    }

    @Test
    void markPaid_rejectsWhenNotFinalized() {
        Payslip payslip = Payslip.builder().id("p-1").status(PayslipStatus.DRAFT).build();
        when(payslipRepository.findById("p-1")).thenReturn(Optional.of(payslip));

        assertThatThrownBy(() -> payrollService.markPaid("p-1"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_PAYSLIP_TRANSITION);
    }
}