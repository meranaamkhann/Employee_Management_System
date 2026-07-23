package com.hrplatform.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, String>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByIdAndDeletedFalse(String id);

    boolean existsByEmailIgnoreCaseAndDeletedFalse(String email);
    boolean existsByEmailIgnoreCaseAndIdNotAndDeletedFalse(String email, String id);

    boolean existsByPhoneAndDeletedFalse(String phone);
    boolean existsByPhoneAndIdNotAndDeletedFalse(String phone, String id);

    boolean existsByEmployeeCodeIgnoreCase(String employeeCode);

    long countByDepartmentIdAndDeletedFalse(String departmentId);

    long countByManagerIdAndDeletedFalse(String managerId);
}
