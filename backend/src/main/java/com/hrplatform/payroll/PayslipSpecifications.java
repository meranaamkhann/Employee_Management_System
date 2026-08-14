package com.hrplatform.payroll;

import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

public final class PayslipSpecifications {

    private PayslipSpecifications() {}

    public static Specification<Payslip> employeeId(String employeeId) {
        if (!StringUtils.hasText(employeeId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("id"), employeeId);
    }

    public static Specification<Payslip> departmentId(String departmentId) {
        if (!StringUtils.hasText(departmentId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("department").get("id"), departmentId);
    }

    public static Specification<Payslip> payMonth(String payMonth) {
        if (!StringUtils.hasText(payMonth)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("payMonth"), payMonth);
    }

    public static Specification<Payslip> status(PayslipStatus status) {
        if (status == null) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("status"), status);
    }

    public static Specification<Payslip> managerScope(String managerId) {
        if (!StringUtils.hasText(managerId)) return Specification.where(null);
        return (root, query, cb) -> cb.equal(root.get("employee").get("manager").get("id"), managerId);
    }
}