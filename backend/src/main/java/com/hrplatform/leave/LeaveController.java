package com.hrplatform.leave;

import com.hrplatform.common.ApiResponse;
import com.hrplatform.common.PageResponse;
import com.hrplatform.leave.dto.*;
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

import java.time.Year;
import java.util.List;

@Tag(name = "Leave")
@RestController
@RequestMapping("/api/v1/leave")
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    @PostMapping("/requests")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> apply(@Valid @RequestBody ApplyLeaveRequest request) {
        String employeeId = requireEmployeeId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Leave request submitted.", leaveService.apply(employeeId, request)));
    }

    @GetMapping("/requests/me")
    public ResponseEntity<ApiResponse<PageResponse<LeaveRequestResponse>>> myRequests(Pageable pageable) {
        String employeeId = requireEmployeeId();
        return ResponseEntity.ok(ApiResponse.ok(leaveService.search(employeeId, null, null, null, null, pageable)));
    }

    @GetMapping("/requests")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<LeaveRequestResponse>>> search(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) LeaveStatus status,
            @RequestParam(required = false) LeaveType leaveType,
            Pageable pageable) {
        UserPrincipal principal = SecurityUtils.currentUser();
        String managerScope = "MANAGER".equals(principal.getRole()) ? principal.getEmployeeId() : null;
        return ResponseEntity.ok(ApiResponse.ok(
                leaveService.search(employeeId, departmentId, status, leaveType, managerScope, pageable)));
    }

    @PostMapping("/requests/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> approve(
            @PathVariable String id, @RequestBody(required = false) ReviewLeaveRequest request) {
        UserPrincipal principal = SecurityUtils.currentUser();
        boolean isManager = "MANAGER".equals(principal.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Leave approved.",
                leaveService.approve(id, principal.getEmployeeId(), isManager, orEmpty(request))));
    }

    @PostMapping("/requests/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> reject(
            @PathVariable String id, @RequestBody(required = false) ReviewLeaveRequest request) {
        UserPrincipal principal = SecurityUtils.currentUser();
        boolean isManager = "MANAGER".equals(principal.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Leave rejected.",
                leaveService.reject(id, principal.getEmployeeId(), isManager, orEmpty(request))));
    }

    @PostMapping("/requests/{id}/cancel")
    public ResponseEntity<ApiResponse<LeaveRequestResponse>> cancel(@PathVariable String id) {
        UserPrincipal principal = SecurityUtils.currentUser();
        boolean isAdminOrHr = "ADMIN".equals(principal.getRole()) || "HR".equals(principal.getRole());
        return ResponseEntity.ok(ApiResponse.ok("Leave cancelled.",
                leaveService.cancel(id, principal.getEmployeeId(), isAdminOrHr)));
    }

    @GetMapping("/balances/me")
    public ResponseEntity<ApiResponse<List<LeaveBalanceResponse>>> myBalances(
            @RequestParam(required = false) Integer year) {
        String employeeId = requireEmployeeId();
        return ResponseEntity.ok(ApiResponse.ok(
                leaveService.getBalances(employeeId, year != null ? year : Year.now().getValue())));
    }

    @GetMapping("/balances")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<List<LeaveBalanceResponse>>> balances(
            @RequestParam String employeeId, @RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.ok(
                leaveService.getBalances(employeeId, year != null ? year : Year.now().getValue())));
    }

    private ReviewLeaveRequest orEmpty(ReviewLeaveRequest request) {
        return request != null ? request : new ReviewLeaveRequest();
    }

    private String requireEmployeeId() {
        String employeeId = SecurityUtils.currentEmployeeId();
        if (employeeId == null) {
            throw com.hrplatform.common.ApiException.badRequest(
                    com.hrplatform.common.ErrorCode.VALIDATION_FAILED, "No employee profile is linked to this account.");
        }
        return employeeId;
    }
}