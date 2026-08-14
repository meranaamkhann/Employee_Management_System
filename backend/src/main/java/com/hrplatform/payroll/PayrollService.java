package com.hrplatform.payroll;

import com.hrplatform.attendance.AttendanceRepository;
import com.hrplatform.attendance.AttendanceStatus;
import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.common.PageResponse;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.employee.EmploymentStatus;
import com.hrplatform.employee.dto.EmployeeResponse;
import com.hrplatform.leave.LeaveRequestRepository;
import com.hrplatform.payroll.dto.GeneratePayrollRequest;
import com.hrplatform.payroll.dto.PayslipResponse;
import com.hrplatform.payroll.dto.UpdatePayslipRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayrollService {

    private static final BigDecimal BASIC_PCT = new BigDecimal("0.50");
    private static final BigDecimal HRA_PCT = new BigDecimal("0.20");
    private static final BigDecimal CONVEYANCE_PCT = new BigDecimal("0.10");
    private static final BigDecimal CONVEYANCE_CAP = new BigDecimal("1600");
    private static final BigDecimal PF_PCT = new BigDecimal("0.12");
    private static final BigDecimal PF_CAP = new BigDecimal("1800");
    private static final BigDecimal PROFESSIONAL_TAX = new BigDecimal("200");

    private final PayslipRepository payslipRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final AuditService auditService;

    @Transactional
    public List<PayslipResponse> generate(GeneratePayrollRequest request) {
        YearMonth month = YearMonth.parse(request.getMonth());

        List<Employee> targets = request.getEmployeeId() != null
                ? List.of(employeeRepository.findByIdAndDeletedFalse(request.getEmployeeId())
                        .orElseThrow(() -> ApiException.notFound("Employee not found.")))
                : employeeRepository.findByStatusAndDeletedFalse(EmploymentStatus.ACTIVE);

        return targets.stream()
                .filter(e -> payslipRepository.findByEmployeeIdAndPayMonth(e.getId(), month.toString()).isEmpty())
                .map(e -> generateFor(e, month))
                .toList();
    }

    private PayslipResponse generateFor(Employee employee, YearMonth month) {
        BigDecimal gross = employee.getSalary() != null ? employee.getSalary() : BigDecimal.ZERO;

        BigDecimal basic = gross.multiply(BASIC_PCT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal hra = gross.multiply(HRA_PCT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal conveyance = gross.multiply(CONVEYANCE_PCT).min(CONVEYANCE_CAP).setScale(2, RoundingMode.HALF_UP);
        BigDecimal special = gross.subtract(basic).subtract(hra).subtract(conveyance).setScale(2, RoundingMode.HALF_UP);

        BigDecimal pf = basic.multiply(PF_PCT).min(PF_CAP).setScale(2, RoundingMode.HALF_UP);

        int unpaidDays = countUnpaidDays(employee.getId(), month);
        BigDecimal perDayRate = gross.divide(BigDecimal.valueOf(month.lengthOfMonth()), 2, RoundingMode.HALF_UP);
        BigDecimal unpaidDeduction = perDayRate.multiply(BigDecimal.valueOf(unpaidDays)).setScale(2, RoundingMode.HALF_UP);

        BigDecimal netSalary = gross.subtract(pf).subtract(PROFESSIONAL_TAX).subtract(unpaidDeduction)
                .setScale(2, RoundingMode.HALF_UP);

        Payslip payslip = Payslip.builder()
                .employee(employee)
                .payMonth(month.toString())
                .basicSalary(basic)
                .hra(hra)
                .conveyanceAllowance(conveyance)
                .specialAllowance(special)
                .grossEarnings(gross)
                .providentFund(pf)
                .professionalTax(PROFESSIONAL_TAX)
                .unpaidLeaveDeduction(unpaidDeduction)
                .bonus(BigDecimal.ZERO)
                .netSalary(netSalary)
                .status(PayslipStatus.DRAFT)
                .build();

        Payslip saved = payslipRepository.save(payslip);
        auditService.record(AuditEntityType.PAYROLL, saved.getId(), AuditAction.CREATE,
                "Generated payslip for " + employee.getFullName() + " (" + month + ")");
        return toResponse(saved);
    }

    private int countUnpaidDays(String employeeId, YearMonth month) {
        LocalDate start = month.atDay(1);
        LocalDate end = month.atEndOfMonth();

        int unpaidLeaveDays = leaveRequestRepository.sumApprovedUnpaidDays(employeeId, start, end);

        long absentDays = attendanceRepository.countGroupedByStatus(employeeId, start, end).stream()
                .filter(sc -> sc.getStatus() == AttendanceStatus.ABSENT)
                .mapToLong(com.hrplatform.attendance.AttendanceRepository.StatusCount::getRecordCount)
                .sum();

        return unpaidLeaveDays + (int) absentDays;
    }

    @Transactional
    public PayslipResponse update(String id, UpdatePayslipRequest request) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Payslip not found."));
        if (payslip.getStatus() != PayslipStatus.DRAFT) {
            throw ApiException.badRequest(ErrorCode.PAYSLIP_LOCKED,
                    "Only DRAFT payslips can be edited. This one is " + payslip.getStatus() + ".");
        }

        BigDecimal bonus = request.getBonus() != null ? request.getBonus() : payslip.getBonus();
        payslip.setBonus(bonus);
        payslip.setNotes(request.getNotes());

        BigDecimal netSalary = payslip.getGrossEarnings()
                .subtract(payslip.getProvidentFund())
                .subtract(payslip.getProfessionalTax())
                .subtract(payslip.getUnpaidLeaveDeduction())
                .add(bonus)
                .setScale(2, RoundingMode.HALF_UP);
        payslip.setNetSalary(netSalary);

        Payslip saved = payslipRepository.save(payslip);
        auditService.record(AuditEntityType.PAYROLL, saved.getId(), AuditAction.UPDATE,
                "Updated payslip for " + saved.getEmployee().getFullName());
        return toResponse(saved);
    }

    @Transactional
    public PayslipResponse finalize(String id) {
        Payslip payslip = requireStatus(id, PayslipStatus.DRAFT, "finalize");
        payslip.setStatus(PayslipStatus.FINALIZED);
        Payslip saved = payslipRepository.save(payslip);
        auditService.record(AuditEntityType.PAYROLL, saved.getId(), AuditAction.APPROVE,
                "Finalized payslip for " + saved.getEmployee().getFullName());
        return toResponse(saved);
    }

    @Transactional
    public PayslipResponse markPaid(String id) {
        Payslip payslip = requireStatus(id, PayslipStatus.FINALIZED, "mark as paid");
        payslip.setStatus(PayslipStatus.PAID);
        payslip.setPaidAt(java.time.Instant.now());
        Payslip saved = payslipRepository.save(payslip);
        auditService.record(AuditEntityType.PAYROLL, saved.getId(), AuditAction.UPDATE,
                "Marked payslip paid for " + saved.getEmployee().getFullName());
        return toResponse(saved);
    }

    private Payslip requireStatus(String id, PayslipStatus required, String action) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Payslip not found."));
        if (payslip.getStatus() != required) {
            throw ApiException.badRequest(ErrorCode.INVALID_PAYSLIP_TRANSITION,
                    "Cannot " + action + " a payslip that is " + payslip.getStatus() + ".");
        }
        return payslip;
    }

    @Transactional(readOnly = true)
    public PageResponse<PayslipResponse> search(String employeeId, String departmentId, String payMonth,
                                                 PayslipStatus status, String managerScopeId, Pageable pageable) {
        Specification<Payslip> spec = Specification
                .where(PayslipSpecifications.employeeId(employeeId))
                .and(PayslipSpecifications.departmentId(departmentId))
                .and(PayslipSpecifications.payMonth(payMonth))
                .and(PayslipSpecifications.status(status))
                .and(PayslipSpecifications.managerScope(managerScopeId));

        Page<Payslip> page = payslipRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    @Transactional(readOnly = true)
    public Payslip getEntityForPdf(String id, String requesterEmployeeId, boolean isPrivileged) {
        Payslip payslip = payslipRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Payslip not found."));
        if (!isPrivileged && !payslip.getEmployee().getId().equals(requesterEmployeeId)) {
            throw ApiException.forbidden(ErrorCode.ACCESS_DENIED, "You cannot access this payslip.");
        }
        return payslip;
    }

    private PayslipResponse toResponse(Payslip p) {
        return PayslipResponse.builder()
                .id(p.getId())
                .employee(EmployeeResponse.EmployeeSummary.builder()
                        .id(p.getEmployee().getId())
                        .fullName(p.getEmployee().getFullName())
                        .employeeCode(p.getEmployee().getEmployeeCode())
                        .build())
                .payMonth(p.getPayMonth())
                .basicSalary(p.getBasicSalary())
                .hra(p.getHra())
                .conveyanceAllowance(p.getConveyanceAllowance())
                .specialAllowance(p.getSpecialAllowance())
                .grossEarnings(p.getGrossEarnings())
                .providentFund(p.getProvidentFund())
                .professionalTax(p.getProfessionalTax())
                .unpaidLeaveDeduction(p.getUnpaidLeaveDeduction())
                .bonus(p.getBonus())
                .netSalary(p.getNetSalary())
                .status(p.getStatus())
                .generatedAt(p.getGeneratedAt())
                .paidAt(p.getPaidAt())
                .notes(p.getNotes())
                .build();
    }
}