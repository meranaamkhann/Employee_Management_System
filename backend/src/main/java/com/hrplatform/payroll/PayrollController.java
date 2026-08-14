package com.hrplatform.payroll;

import com.hrplatform.common.ApiResponse;
import com.hrplatform.common.PageResponse;
import com.hrplatform.payroll.dto.GeneratePayrollRequest;
import com.hrplatform.payroll.dto.PayslipResponse;
import com.hrplatform.payroll.dto.UpdatePayslipRequest;
import com.hrplatform.security.SecurityUtils;
import com.hrplatform.security.UserPrincipal;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Payroll")
@RestController
@RequestMapping("/api/v1/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollService payrollService;
    private final PayslipPdfService payslipPdfService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<List<PayslipResponse>>> generate(@Valid @RequestBody GeneratePayrollRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Payroll generated.", payrollService.generate(request)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<PageResponse<PayslipResponse>>> myPayslips(
            @RequestParam(required = false) String month, Pageable pageable) {
        String employeeId = SecurityUtils.currentEmployeeId();
        return ResponseEntity.ok(ApiResponse.ok(payrollService.search(employeeId, null, month, null, null, pageable)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<PayslipResponse>>> search(
            @RequestParam(required = false) String employeeId,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) PayslipStatus status,
            Pageable pageable) {
        UserPrincipal principal = SecurityUtils.currentUser();
        String managerScope = "MANAGER".equals(principal.getRole()) ? principal.getEmployeeId() : null;
        return ResponseEntity.ok(ApiResponse.ok(
                payrollService.search(employeeId, departmentId, month, status, managerScope, pageable)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<PayslipResponse>> update(
            @PathVariable String id, @RequestBody UpdatePayslipRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Payslip updated.", payrollService.update(id, request)));
    }

    @PostMapping("/{id}/finalize")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<PayslipResponse>> finalize(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Payslip finalized.", payrollService.finalize(id)));
    }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<PayslipResponse>> markPaid(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Payslip marked as paid.", payrollService.markPaid(id)));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable String id) {
        UserPrincipal principal = SecurityUtils.currentUser();
        boolean privileged = "ADMIN".equals(principal.getRole()) || "HR".equals(principal.getRole());
        Payslip payslip = payrollService.getEntityForPdf(id, principal.getEmployeeId(), privileged);
        byte[] pdf = payslipPdfService.render(payslip);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"payslip-" + payslip.getPayMonth() + ".pdf\"")
                .body(pdf);
    }
}
