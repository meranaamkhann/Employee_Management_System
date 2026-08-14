package com.hrplatform.employee;

import com.hrplatform.common.ApiException;
import com.hrplatform.common.ApiResponse;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.common.PageResponse;
import com.hrplatform.employee.dto.EmployeeRequest;
import com.hrplatform.employee.dto.EmployeeResponse;
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
import com.hrplatform.common.CsvUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@Tag(name = "Employees")
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    /**
     * ADMIN and HR see the whole directory. MANAGER is transparently scoped
     * to their own direct reports by forcing the managerId filter — the
     * frontend never has to know the difference, it just calls this one
     * endpoint and gets back whatever the caller is allowed to see.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<ApiResponse<PageResponse<EmployeeResponse>>> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) EmploymentStatus status,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String managerId,
            Pageable pageable) {

        UserPrincipal principal = SecurityUtils.currentUser();
        String effectiveManagerId = managerId;
        if ("MANAGER".equals(principal.getRole())) {
            effectiveManagerId = principal.getEmployeeId();
        }

        return ResponseEntity.ok(ApiResponse.ok(
                employeeService.search(q, departmentId, status, gender, effectiveManagerId, pageable)));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<EmployeeResponse>> myProfile() {
        String employeeId = SecurityUtils.currentEmployeeId();
        if (employeeId == null) {
            throw ApiException.notFound("No employee profile is linked to this account.");
        }
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getById(employeeId)));
    }

    @GetMapping("/export")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER')")
    public ResponseEntity<StreamingResponseBody> exportCsv(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String departmentId,
            @RequestParam(required = false) EmploymentStatus status,
            @RequestParam(required = false) Gender gender,
            @RequestParam(required = false) String managerId) {

        UserPrincipal principal = SecurityUtils.currentUser();
        String effectiveManagerId = managerId;
        if ("MANAGER".equals(principal.getRole())) {
            effectiveManagerId = principal.getEmployeeId();
        }

        List<com.hrplatform.employee.Employee> rows =
                employeeService.searchForExport(q, departmentId, status, gender, effectiveManagerId);

        StreamingResponseBody body = outputStream -> {
            OutputStream out = outputStream;
            out.write(CsvUtils.row(
                    "Employee Code", "Full Name", "Email", "Phone", "Gender", "Date of Birth",
                    "Department", "Designation", "Joining Date", "Salary", "Status",
                    "Manager", "City", "Country"
            ).getBytes(StandardCharsets.UTF_8));

            for (com.hrplatform.employee.Employee e : rows) {
                out.write(CsvUtils.row(
                        e.getEmployeeCode(),
                        e.getFullName(),
                        e.getEmail(),
                        e.getPhone(),
                        e.getGender(),
                        e.getDateOfBirth(),
                        e.getDepartment() != null ? e.getDepartment().getName() : "",
                        e.getDesignation(),
                        e.getJoiningDate(),
                        e.getSalary(),
                        e.getStatus(),
                        e.getManager() != null ? e.getManager().getFullName() : "",
                        e.getCity(),
                        e.getCountry()
                ).getBytes(StandardCharsets.UTF_8));
            }
            out.flush();
        };

        String filename = "employees-export-" + java.time.LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(body);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> getById(@PathVariable String id) {
        UserPrincipal principal = SecurityUtils.currentUser();
        if ("EMPLOYEE".equals(principal.getRole()) && !id.equals(principal.getEmployeeId())) {
            throw ApiException.forbidden(ErrorCode.ACCESS_DENIED, "You can only view your own profile.");
        }
        return ResponseEntity.ok(ApiResponse.ok(employeeService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> create(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse created = employeeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Employee created.", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> update(@PathVariable String id, @Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Employee updated.", employeeService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        employeeService.softDelete(id, SecurityUtils.currentEmployeeId());
        return ResponseEntity.ok(ApiResponse.message("Employee deleted."));
    }

    @PostMapping("/bulk-delete")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> bulkDelete(@RequestBody Map<String, List<String>> body) {
        List<String> ids = body.getOrDefault("ids", List.of());
        employeeService.bulkSoftDelete(ids, SecurityUtils.currentEmployeeId());
        return ResponseEntity.ok(ApiResponse.message(ids.size() + " employee(s) deleted."));
    }

    @PostMapping("/{id}/restore")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<EmployeeResponse>> restore(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok("Employee restored.", employeeService.restore(id)));
    }
}
