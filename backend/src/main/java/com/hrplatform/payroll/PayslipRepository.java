package com.hrplatform.payroll;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface PayslipRepository extends JpaRepository<Payslip, String>, JpaSpecificationExecutor<Payslip> {
    Optional<Payslip> findByEmployeeIdAndPayMonth(String employeeId, String payMonth);
}