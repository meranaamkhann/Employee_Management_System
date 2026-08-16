package com.hrplatform.employee;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, String>, JpaSpecificationExecutor<Employee> {

    Optional<Employee> findByIdAndDeletedFalse(String id);
    Optional<Employee> findByEmailIgnoreCaseAndDeletedFalse(String email);

    boolean existsByEmailIgnoreCaseAndDeletedFalse(String email);
    boolean existsByEmailIgnoreCaseAndIdNotAndDeletedFalse(String email, String id);

    boolean existsByPhoneAndDeletedFalse(String phone);
    boolean existsByPhoneAndIdNotAndDeletedFalse(String phone, String id);

    boolean existsByEmployeeCodeIgnoreCase(String employeeCode);

    long countByDepartmentIdAndDeletedFalse(String departmentId);

    long countByManagerIdAndDeletedFalse(String managerId);

    long countByDeletedFalse();

    long countByDeletedFalseAndJoiningDateBetween(LocalDate start, LocalDate end);

    List<Employee> findTop5ByDeletedFalseAndJoiningDateIsNotNullOrderByJoiningDateDesc();

    List<Employee> findByStatusAndDeletedFalse(EmploymentStatus status);

    /**
     * One query for every department's headcount, instead of one query per
     * department. Callers that need counts for a whole list of departments
     * (DepartmentService.listAll, DashboardService) should always use this
     * instead of looping countByDepartmentIdAndDeletedFalse — that loop is
     * exactly the N+1 pattern this method exists to avoid.
     */
    @Query("""
            select e.department.id as departmentId, count(e) as employeeCount
            from Employee e
            where e.deleted = false and e.department is not null
            group by e.department.id
            """)
    List<DepartmentHeadcount> countActiveGroupedByDepartment();

    @Query("""
            select e.status as status, count(e) as employeeCount
            from Employee e
            where e.deleted = false
            group by e.status
            """)
    List<StatusHeadcount> countActiveGroupedByStatus();

    @Query("""
            select coalesce(sum(e.salary), 0)
            from Employee e
            where e.deleted = false and e.status = com.hrplatform.employee.EmploymentStatus.ACTIVE and e.salary is not null
            """)
    BigDecimal sumActiveSalaries();

    interface DepartmentHeadcount {
        String getDepartmentId();
        long getEmployeeCount();
    }

    interface StatusHeadcount {
        EmploymentStatus getStatus();
        long getEmployeeCount();
    }
}
