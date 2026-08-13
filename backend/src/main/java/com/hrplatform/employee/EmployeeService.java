package com.hrplatform.employee;

import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.common.PageResponse;
import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.department.Department;
import com.hrplatform.department.DepartmentRepository;
import com.hrplatform.employee.dto.EmployeeRequest;
import com.hrplatform.employee.dto.EmployeeResponse;
import com.hrplatform.employee.mapper.EmployeeMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private static final int MAX_HIERARCHY_DEPTH = 50;

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final EmployeeMapper employeeMapper;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public PageResponse<EmployeeResponse> search(String term, String departmentId, EmploymentStatus status,
                                                  Gender gender, String managerId, Pageable pageable) {
        Specification<Employee> spec = Specification
                .where(EmployeeSpecifications.notDeleted())
                .and(EmployeeSpecifications.search(term))
                .and(EmployeeSpecifications.departmentId(departmentId))
                .and(EmployeeSpecifications.status(status))
                .and(EmployeeSpecifications.gender(gender))
                .and(EmployeeSpecifications.managerId(managerId));

        Page<Employee> page = employeeRepository.findAll(spec, pageable);
        List<EmployeeResponse> mapped = page.getContent().stream().map(employeeMapper::toResponse).toList();
        return PageResponse.of(page, mapped);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getById(String id) {
        Employee employee = findActiveOrThrow(id);
        return employeeMapper.toResponse(employee);
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        validateNoDuplicateEmail(request.getEmail(), null);
        validateNoDuplicatePhone(request.getPhone(), null);

        Employee employee = new Employee();
        applyRequest(employee, request, null);
        employee.setEmployeeCode(generateEmployeeCode());

        Employee saved = employeeRepository.save(employee);
        auditService.record(AuditEntityType.EMPLOYEE, saved.getId(), AuditAction.CREATE,
                "Created employee " + saved.getFullName() + " (" + saved.getEmployeeCode() + ")");
        return employeeMapper.toResponse(saved);
    }

    @Transactional
    public EmployeeResponse update(String id, EmployeeRequest request) {
        Employee employee = findActiveOrThrow(id);

        validateNoDuplicateEmail(request.getEmail(), id);
        validateNoDuplicatePhone(request.getPhone(), id);

        applyRequest(employee, request, id);

        Employee saved = employeeRepository.save(employee);
        auditService.record(AuditEntityType.EMPLOYEE, saved.getId(), AuditAction.UPDATE,
                "Updated employee " + saved.getFullName() + " (" + saved.getEmployeeCode() + ")");
        return employeeMapper.toResponse(saved);
    }

    @Transactional
    public void softDelete(String id, String requestingUserEmployeeId) {
        Employee employee = findActiveOrThrow(id);

        if (id.equals(requestingUserEmployeeId)) {
            throw ApiException.forbidden(ErrorCode.SELF_DELETE_FORBIDDEN,
                    "You cannot delete your own employee record.");
        }

        employee.setDeleted(true);
        employee.setDeletedAt(Instant.now());
        employeeRepository.save(employee);
        auditService.record(AuditEntityType.EMPLOYEE, employee.getId(), AuditAction.DELETE,
                "Deleted employee " + employee.getFullName() + " (" + employee.getEmployeeCode() + ")");
    }

    @Transactional
    public void bulkSoftDelete(List<String> ids, String requestingUserEmployeeId) {
        if (ids.contains(requestingUserEmployeeId)) {
            throw ApiException.forbidden(ErrorCode.SELF_DELETE_FORBIDDEN,
                    "You cannot delete your own employee record.");
        }
        List<Employee> employees = employeeRepository.findAllById(ids);
        Instant now = Instant.now();
        employees.forEach(e -> {
            e.setDeleted(true);
            e.setDeletedAt(now);
        });
        employeeRepository.saveAll(employees);
        auditService.record(AuditEntityType.EMPLOYEE, null, AuditAction.DELETE,
                "Bulk-deleted " + employees.size() + " employee(s): "
                        + employees.stream().map(Employee::getFullName).limit(10).reduce((a, b) -> a + ", " + b).orElse(""));
    }

    @Transactional
    public EmployeeResponse restore(String id) {
        Employee employee = employeeRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Employee not found."));
        if (!employee.isDeleted()) {
            throw ApiException.conflict(ErrorCode.CONFLICT, "Employee is not deleted.");
        }
        employee.setDeleted(false);
        employee.setDeletedAt(null);
        Employee saved = employeeRepository.save(employee);
        auditService.record(AuditEntityType.EMPLOYEE, saved.getId(), AuditAction.RESTORE,
                "Restored employee " + saved.getFullName() + " (" + saved.getEmployeeCode() + ")");
        return employeeMapper.toResponse(saved);
    }

    // ---- internal helpers -------------------------------------------------

    private Employee findActiveOrThrow(String id) {
        return employeeRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> ApiException.notFound("Employee not found."));
    }

    private void applyRequest(Employee employee, EmployeeRequest request, String existingId) {
        employee.setFullName(request.getFullName().trim());
        employee.setEmail(request.getEmail().trim().toLowerCase());
        employee.setPhone(StringUtils.hasText(request.getPhone()) ? request.getPhone().trim() : null);
        employee.setGender(request.getGender());
        employee.setDateOfBirth(request.getDateOfBirth());
        employee.setDesignation(request.getDesignation());
        employee.setJoiningDate(request.getJoiningDate());
        employee.setSalary(request.getSalary());
        employee.setStatus(request.getStatus() != null ? request.getStatus() : EmploymentStatus.ACTIVE);
        employee.setEmergencyContactName(request.getEmergencyContactName());
        employee.setEmergencyContactPhone(request.getEmergencyContactPhone());
        employee.setAddressLine(request.getAddressLine());
        employee.setCity(request.getCity());
        employee.setCountry(request.getCountry());
        employee.setPhotoUrl(request.getPhotoUrl());
        employee.setNotes(request.getNotes());

        if (StringUtils.hasText(request.getDepartmentId())) {
            Department department = departmentRepository.findByIdAndDeletedFalse(request.getDepartmentId())
                    .orElseThrow(() -> ApiException.badRequest(ErrorCode.VALIDATION_FAILED,
                            "Selected department does not exist."));
            employee.setDepartment(department);
        } else {
            employee.setDepartment(null);
        }

        applyManager(employee, request.getManagerId(), existingId);
    }

    private void applyManager(Employee employee, String managerId, String existingId) {
        if (!StringUtils.hasText(managerId)) {
            employee.setManager(null);
            return;
        }

        if (managerId.equals(existingId)) {
            throw ApiException.badRequest(ErrorCode.SELF_MANAGER_FORBIDDEN,
                    "An employee cannot be their own manager.");
        }

        Employee manager = employeeRepository.findByIdAndDeletedFalse(managerId)
                .orElseThrow(() -> ApiException.badRequest(ErrorCode.VALIDATION_FAILED,
                        "Selected manager does not exist."));

        if (existingId != null) {
            assertNoCircularHierarchy(existingId, manager);
        }

        employee.setManager(manager);
    }

    /**
     * Walks upward from the proposed manager toward the top of the org chart.
     * If we ever encounter the employee being edited, assigning this manager
     * would create a cycle (e.g. A manages B, B manages A) — reject it.
     */
    private void assertNoCircularHierarchy(String employeeId, Employee proposedManager) {
        Set<String> visited = new HashSet<>();
        Employee current = proposedManager;
        int depth = 0;

        while (current != null) {
            if (current.getId().equals(employeeId)) {
                throw ApiException.badRequest(ErrorCode.CIRCULAR_HIERARCHY,
                        "This assignment would create a circular reporting hierarchy.");
            }
            if (!visited.add(current.getId()) || ++depth > MAX_HIERARCHY_DEPTH) {
                break; // already-broken cycle upstream or pathological depth; don't loop forever
            }
            current = current.getManager();
        }
    }

    private void validateNoDuplicateEmail(String email, String excludingId) {
        boolean exists = excludingId == null
                ? employeeRepository.existsByEmailIgnoreCaseAndDeletedFalse(email)
                : employeeRepository.existsByEmailIgnoreCaseAndIdNotAndDeletedFalse(email, excludingId);
        if (exists) {
            throw ApiException.conflict(ErrorCode.DUPLICATE_EMAIL, "An employee with this email already exists.");
        }
    }

    private void validateNoDuplicatePhone(String phone, String excludingId) {
        if (!StringUtils.hasText(phone)) return;
        boolean exists = excludingId == null
                ? employeeRepository.existsByPhoneAndDeletedFalse(phone)
                : employeeRepository.existsByPhoneAndIdNotAndDeletedFalse(phone, excludingId);
        if (exists) {
            throw ApiException.conflict(ErrorCode.DUPLICATE_PHONE, "An employee with this phone number already exists.");
        }
    }

    private String generateEmployeeCode() {
        long sequence = employeeRepository.count() + 1;
        String candidate = String.format("EMP-%06d", sequence);
        // Extremely unlikely after soft-deletes/gaps, but guarantee uniqueness rather than assume it.
        while (employeeRepository.existsByEmployeeCodeIgnoreCase(candidate)) {
            sequence++;
            candidate = String.format("EMP-%06d", sequence);
        }
        return candidate;
    }
}
