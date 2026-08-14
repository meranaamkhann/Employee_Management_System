package com.hrplatform.leave;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.time.LocalDate;

public final class LeaveRequestSpecifications {

    private LeaveRequestSpecifications() {}

    public static Specification<LeaveRequest> employeeId(String employeeId) {
        if (!StringUtils.hasText(employeeId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("id"), employeeId);
    }

    public static Specification<LeaveRequest> departmentId(String departmentId) {
        if (!StringUtils.hasText(departmentId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("department").get("id"), departmentId);
    }

    public static Specification<LeaveRequest> status(LeaveStatus status) {
        if (status == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<LeaveRequest> leaveType(LeaveType leaveType) {
        if (leaveType == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("leaveType"), leaveType);
    }

    public static Specification<LeaveRequest> managerScope(String managerId) {
        if (!StringUtils.hasText(managerId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("manager").get("id"), managerId);
    }
}