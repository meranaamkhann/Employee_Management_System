package com.hrplatform.department;

import com.hrplatform.common.ApiResponse;
import com.hrplatform.department.dto.DepartmentRequest;
import com.hrplatform.department.dto.DepartmentResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Departments")
@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.listAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR','MANAGER','EMPLOYEE')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(departmentService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> create(@Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse created = departmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Department created.", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<DepartmentResponse>> update(@PathVariable String id, @Valid @RequestBody DepartmentRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Department updated.", departmentService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        departmentService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.message("Department deleted."));
    }
}
