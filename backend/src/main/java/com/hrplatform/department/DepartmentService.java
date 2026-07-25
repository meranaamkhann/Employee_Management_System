package com.hrplatform.department;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.department.dto.DepartmentRequest;
import com.hrplatform.department.dto.DepartmentResponse;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listAll() {
        List<Department> departments = departmentRepository.findByDeletedFalseOrderByNameAsc();

        // One query for every department's headcount instead of one query
        // per department (see EmployeeRepository.countActiveGroupedByDepartment).
        Map<String, Long> headcounts = employeeRepository.countActiveGroupedByDepartment().stream()
                .collect(Collectors.toMap(
                        EmployeeRepository.DepartmentHeadcount::getDepartmentId,
                        EmployeeRepository.DepartmentHeadcount::getEmployeeCount));

        return departments.stream()
                .map(d -> toResponse(d, headcounts.getOrDefault(d.getId(), 0L)))
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getById(String id) {
        Department department = departmentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> ApiException.notFound("Department not found."));
        long count = employeeRepository.countByDepartmentIdAndDeletedFalse(id);
        return toResponse(department, count);
    }

    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        validateUniqueName(request.getName(), null);

        Department department = Department.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .budget(request.getBudget())
                .build();

        applyHead(department, request.getHeadEmployeeId());

        Department saved = departmentRepository.save(department);
        auditService.record(AuditEntityType.DEPARTMENT, saved.getId(), AuditAction.CREATE,
                "Created department " + saved.getName());
        return toResponse(saved, 0);
    }

    @Transactional
    public DepartmentResponse update(String id, DepartmentRequest request) {
        Department department = departmentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> ApiException.notFound("Department not found."));

        validateUniqueName(request.getName(), id);

        department.setName(request.getName().trim());
        department.setDescription(request.getDescription());
        department.setBudget(request.getBudget());
        applyHead(department, request.getHeadEmployeeId());

        Department saved = departmentRepository.save(department);
        auditService.record(AuditEntityType.DEPARTMENT, saved.getId(), AuditAction.UPDATE,
                "Updated department " + saved.getName());
        long count = employeeRepository.countByDepartmentIdAndDeletedFalse(id);
        return toResponse(saved, count);
    }

    @Transactional
    public void softDelete(String id) {
        Department department = departmentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> ApiException.notFound("Department not found."));

        long activeEmployeeCount = employeeRepository.countByDepartmentIdAndDeletedFalse(id);
        if (activeEmployeeCount > 0) {
            throw ApiException.conflict(ErrorCode.DEPARTMENT_NOT_EMPTY,
                    "This department still has " + activeEmployeeCount + " employee(s) assigned. Reassign them before deleting.");
        }

        department.setDeleted(true);
        department.setDeletedAt(Instant.now());
        departmentRepository.save(department);
        auditService.record(AuditEntityType.DEPARTMENT, department.getId(), AuditAction.DELETE,
                "Deleted department " + department.getName());
    }

    private void applyHead(Department department, String headEmployeeId) {
        if (!StringUtils.hasText(headEmployeeId)) {
            department.setHead(null);
            return;
        }
        Employee head = employeeRepository.findByIdAndDeletedFalse(headEmployeeId)
                .orElseThrow(() -> ApiException.badRequest(ErrorCode.VALIDATION_FAILED, "Selected department head does not exist."));
        department.setHead(head);
    }

    private void validateUniqueName(String name, String excludingId) {
        boolean exists = excludingId == null
                ? departmentRepository.existsByNameIgnoreCaseAndDeletedFalse(name)
                : departmentRepository.existsByNameIgnoreCaseAndIdNotAndDeletedFalse(name, excludingId);
        if (exists) {
            throw ApiException.conflict(ErrorCode.CONFLICT, "A department with this name already exists.");
        }
    }

    private DepartmentResponse toResponse(Department department, long employeeCount) {
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .headEmployeeId(department.getHead() != null ? department.getHead().getId() : null)
                .headEmployeeName(department.getHead() != null ? department.getHead().getFullName() : null)
                .budget(department.getBudget())
                .employeeCount(employeeCount)
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}
