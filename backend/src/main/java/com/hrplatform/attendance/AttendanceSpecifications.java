package com.hrplatform.attendance;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public final class AttendanceSpecifications {

    private AttendanceSpecifications() {}

    public static Specification<AttendanceRecord> employeeId(String employeeId) {
        if (!StringUtils.hasText(employeeId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("id"), employeeId);
    }

    public static Specification<AttendanceRecord> departmentId(String departmentId) {
        if (!StringUtils.hasText(departmentId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("department").get("id"), departmentId);
    }

    public static Specification<AttendanceRecord> status(AttendanceStatus status) {
        if (status == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<AttendanceRecord> dateBetween(LocalDate from, LocalDate to) {
        if (from == null && to == null) return Specification.where(null);
        if (from != null && to != null) {
            return (root, query, cb) -> cb.between(root.get("workDate"), from, to);
        }
        if (from != null) {
            return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("workDate"), from);
        }
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("workDate"), to);
    }

    /**
     * MANAGER role is scoped to direct reports only — same guarantee the
     * employee endpoints already give, applied here so a manager can never
     * see attendance data outside their own team by hitting this endpoint
     * with a different employeeId/departmentId filter.
     */
    public static Specification<AttendanceRecord> managerScope(String managerId) {
        if (!StringUtils.hasText(managerId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("manager").get("id"), managerId);
    }
}