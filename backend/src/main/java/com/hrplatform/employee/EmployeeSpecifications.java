package com.hrplatform.employee;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

/**
 * Composable filter predicates for the employee search/filter endpoint.
 * Kept separate from the repository so new filters can be added without
 * touching query methods or the service's core CRUD logic.
 */
public final class EmployeeSpecifications {

    private EmployeeSpecifications() {
    }

    public static Specification<Employee> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    public static Specification<Employee> search(String term) {
        if (!StringUtils.hasText(term)) {
            return Specification.where(null);
        }
        String like = "%" + term.trim().toLowerCase() + "%";
        return (root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("fullName")), like),
                cb.like(cb.lower(root.get("email")), like),
                cb.like(cb.lower(root.get("employeeCode")), like),
                cb.like(cb.lower(root.get("designation")), like)
        );
    }

    public static Specification<Employee> departmentId(String departmentId) {
        if (!StringUtils.hasText(departmentId)) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("department").get("id"), departmentId);
    }

    public static Specification<Employee> status(EmploymentStatus status) {
        if (status == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Employee> gender(Gender gender) {
        if (gender == null) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("gender"), gender);
    }

    public static Specification<Employee> managerId(String managerId) {
        if (!StringUtils.hasText(managerId)) {
            return Specification.where(null);
        }
        return (root, query, cb) -> cb.equal(root.get("manager").get("id"), managerId);
    }
}
