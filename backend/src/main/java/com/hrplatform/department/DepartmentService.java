package com.hrplatform.department;

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

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    @Transactional(readOnly = true)
    public List<DepartmentResponse> listAll() {
        return departmentRepository.findByDeletedFalseOrderByNameAsc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentResponse getById(String id) {
        Department department = departmentRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> ApiException.notFound("Department not found."));
        return toResponse(department);
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

        return toResponse(departmentRepository.save(department));
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

        return toResponse(departmentRepository.save(department));
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

    private DepartmentResponse toResponse(Department department) {
        long count = employeeRepository.countByDepartmentIdAndDeletedFalse(department.getId());
        return DepartmentResponse.builder()
                .id(department.getId())
                .name(department.getName())
                .description(department.getDescription())
                .headEmployeeId(department.getHead() != null ? department.getHead().getId() : null)
                .headEmployeeName(department.getHead() != null ? department.getHead().getFullName() : null)
                .budget(department.getBudget())
                .employeeCount(count)
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}
