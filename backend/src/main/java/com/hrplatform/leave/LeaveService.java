package com.hrplatform.leave;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.common.PageResponse;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.employee.dto.EmployeeResponse;
import com.hrplatform.leave.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class LeaveService {

    /** Default annual allocation per leave type. UNPAID is deliberately absent — it's uncapped. */
    private static final Map<LeaveType, Integer> DEFAULT_ALLOCATION = new EnumMap<>(Map.of(
            LeaveType.CASUAL, 12,
            LeaveType.SICK, 8,
            LeaveType.EARNED, 15
    ));

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    // ---- requests -----------------------------------------------------

    @Transactional
    public LeaveRequestResponse apply(String employeeId, ApplyLeaveRequest request) {
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw ApiException.badRequest(ErrorCode.INVALID_DATE_RANGE, "End date cannot be before start date.");
        }

        Employee employee = employeeRepository.findByIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> ApiException.notFound("Employee not found."));

        List<LeaveRequest> overlapping = leaveRequestRepository.findOverlapping(
                employeeId, request.getStartDate(), request.getEndDate());
        if (!overlapping.isEmpty()) {
            throw ApiException.conflict(ErrorCode.OVERLAPPING_LEAVE_REQUEST,
                    "You already have a pending or approved leave request that overlaps these dates.");
        }

        int days = (int) (ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1);

        if (request.getLeaveType() != LeaveType.UNPAID) {
            LeaveBalance balance = getOrCreateBalance(employee, request.getLeaveType(), request.getStartDate().getYear());
            if (balance.getRemainingDays() < days) {
                throw ApiException.badRequest(ErrorCode.INSUFFICIENT_LEAVE_BALANCE,
                        "Insufficient " + request.getLeaveType() + " balance: " + balance.getRemainingDays()
                                + " day(s) remaining, " + days + " requested.");
            }
        }

        LeaveRequest leaveRequest = LeaveRequest.builder()
                .employee(employee)
                .leaveType(request.getLeaveType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .numberOfDays(days)
                .reason(request.getReason())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        auditService.record(AuditEntityType.LEAVE_REQUEST, saved.getId(), AuditAction.CREATE,
                employee.getFullName() + " applied for " + days + " day(s) " + request.getLeaveType() + " leave");
        return toResponse(saved);
    }

    @Transactional
    public LeaveRequestResponse approve(String id, String reviewerEmployeeId, boolean isManagerRole, ReviewLeaveRequest request) {
        LeaveRequest leaveRequest = requirePending(id);
        assertReviewerAllowed(leaveRequest, reviewerEmployeeId, isManagerRole);

        if (leaveRequest.getLeaveType() != LeaveType.UNPAID) {
            LeaveBalance balance = getOrCreateBalance(
                    leaveRequest.getEmployee(), leaveRequest.getLeaveType(), leaveRequest.getStartDate().getYear());
            balance.setUsedDays(balance.getUsedDays() + leaveRequest.getNumberOfDays());
            leaveBalanceRepository.save(balance);
        }

        leaveRequest.setStatus(LeaveStatus.APPROVED);
        leaveRequest.setReviewedBy(employeeRepository.findById(reviewerEmployeeId).orElse(null));
        leaveRequest.setReviewNote(request.getNote());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        auditService.record(AuditEntityType.LEAVE_REQUEST, saved.getId(), AuditAction.APPROVE,
                "Approved leave for " + saved.getEmployee().getFullName());
        return toResponse(saved);
    }

    @Transactional
    public LeaveRequestResponse reject(String id, String reviewerEmployeeId, boolean isManagerRole, ReviewLeaveRequest request) {
        LeaveRequest leaveRequest = requirePending(id);
        assertReviewerAllowed(leaveRequest, reviewerEmployeeId, isManagerRole);

        leaveRequest.setStatus(LeaveStatus.REJECTED);
        leaveRequest.setReviewedBy(employeeRepository.findById(reviewerEmployeeId).orElse(null));
        leaveRequest.setReviewNote(request.getNote());

        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        auditService.record(AuditEntityType.LEAVE_REQUEST, saved.getId(), AuditAction.REJECT,
                "Rejected leave for " + saved.getEmployee().getFullName());
        return toResponse(saved);
    }

    /**
     * Employees can cancel their own still-pending request. ADMIN/HR can
     * cancel a pending OR already-approved request (e.g. plans changed) —
     * cancelling an approved request refunds the balance that was deducted.
     */
    @Transactional
    public LeaveRequestResponse cancel(String id, String requesterEmployeeId, boolean isAdminOrHr) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Leave request not found."));

        boolean isOwner = leaveRequest.getEmployee().getId().equals(requesterEmployeeId);
        if (!isOwner && !isAdminOrHr) {
            throw ApiException.forbidden(ErrorCode.ACCESS_DENIED, "You cannot cancel this leave request.");
        }
        if (isOwner && !isAdminOrHr && leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw ApiException.badRequest(ErrorCode.LEAVE_REQUEST_NOT_PENDING,
                    "Only pending requests can be cancelled.");
        }
        if (leaveRequest.getStatus() == LeaveStatus.CANCELLED || leaveRequest.getStatus() == LeaveStatus.REJECTED) {
            throw ApiException.conflict(ErrorCode.CONFLICT, "This request is already " + leaveRequest.getStatus() + ".");
        }

        if (leaveRequest.getStatus() == LeaveStatus.APPROVED && leaveRequest.getLeaveType() != LeaveType.UNPAID) {
            LeaveBalance balance = getOrCreateBalance(
                    leaveRequest.getEmployee(), leaveRequest.getLeaveType(), leaveRequest.getStartDate().getYear());
            balance.setUsedDays(Math.max(0, balance.getUsedDays() - leaveRequest.getNumberOfDays()));
            leaveBalanceRepository.save(balance);
        }

        leaveRequest.setStatus(LeaveStatus.CANCELLED);
        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        auditService.record(AuditEntityType.LEAVE_REQUEST, saved.getId(), AuditAction.UPDATE,
                "Cancelled leave for " + saved.getEmployee().getFullName());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<LeaveRequestResponse> search(String employeeId, String departmentId, LeaveStatus status,
                                                       LeaveType leaveType, String managerScopeId, Pageable pageable) {
        Specification<LeaveRequest> spec = Specification
                .where(LeaveRequestSpecifications.employeeId(employeeId))
                .and(LeaveRequestSpecifications.departmentId(departmentId))
                .and(LeaveRequestSpecifications.status(status))
                .and(LeaveRequestSpecifications.leaveType(leaveType))
                .and(LeaveRequestSpecifications.managerScope(managerScopeId));

        Page<LeaveRequest> page = leaveRequestRepository.findAll(spec, pageable);
        return PageResponse.of(page, page.getContent().stream().map(this::toResponse).toList());
    }

    // ---- balances -------------------------------------------------------

    @Transactional
    public List<LeaveBalanceResponse> getBalances(String employeeId, int year) {
        Employee employee = employeeRepository.findByIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> ApiException.notFound("Employee not found."));

        return DEFAULT_ALLOCATION.keySet().stream()
                .map(type -> {
                    LeaveBalance balance = getOrCreateBalance(employee, type, year);
                    return LeaveBalanceResponse.builder()
                            .leaveType(type)
                            .year(year)
                            .allocatedDays(balance.getAllocatedDays())
                            .usedDays(balance.getUsedDays())
                            .remainingDays(balance.getRemainingDays())
                            .build();
                })
                .toList();
    }

    private LeaveBalance getOrCreateBalance(Employee employee, LeaveType type, int year) {
        return leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndYear(employee.getId(), type, year)
                .orElseGet(() -> leaveBalanceRepository.save(LeaveBalance.builder()
                        .employee(employee)
                        .leaveType(type)
                        .year(year)
                        .allocatedDays(DEFAULT_ALLOCATION.getOrDefault(type, 0))
                        .usedDays(0)
                        .build()));
    }

    // ---- internal helpers -------------------------------------------------

    private LeaveRequest requirePending(String id) {
        LeaveRequest leaveRequest = leaveRequestRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Leave request not found."));
        if (leaveRequest.getStatus() != LeaveStatus.PENDING) {
            throw ApiException.badRequest(ErrorCode.LEAVE_REQUEST_NOT_PENDING,
                    "This request has already been " + leaveRequest.getStatus() + ".");
        }
        return leaveRequest;
    }

    private void assertReviewerAllowed(LeaveRequest leaveRequest, String reviewerEmployeeId, boolean isManagerRole) {
        if (!isManagerRole) return; // ADMIN/HR can review anyone
        Employee manager = leaveRequest.getEmployee().getManager();
        if (manager == null || !manager.getId().equals(reviewerEmployeeId)) {
            throw ApiException.forbidden(ErrorCode.ACCESS_DENIED,
                    "You can only review leave requests for your own direct reports.");
        }
    }

    private LeaveRequestResponse toResponse(LeaveRequest r) {
        return LeaveRequestResponse.builder()
                .id(r.getId())
                .employee(summary(r.getEmployee()))
                .leaveType(r.getLeaveType())
                .startDate(r.getStartDate())
                .endDate(r.getEndDate())
                .numberOfDays(r.getNumberOfDays())
                .reason(r.getReason())
                .status(r.getStatus())
                .reviewedBy(r.getReviewedBy() != null ? summary(r.getReviewedBy()) : null)
                .reviewNote(r.getReviewNote())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private EmployeeResponse.EmployeeSummary summary(Employee e) {
        return EmployeeResponse.EmployeeSummary.builder()
                .id(e.getId()).fullName(e.getFullName()).employeeCode(e.getEmployeeCode()).build();
    }
}