package com.hrplatform.dashboard;

import com.hrplatform.dashboard.dto.DashboardStatsResponse;
import com.hrplatform.department.Department;
import com.hrplatform.department.DepartmentRepository;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.employee.EmploymentStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Every number here comes from an aggregate query (COUNT/SUM/GROUP BY, or a
 * bounded top-N fetch) rather than loading the employee table into memory
 * and summarizing it in Java — the previous version did the latter, which
 * gets slower with every employee added instead of staying flat.
 */
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        long totalEmployees = employeeRepository.countByDeletedFalse();

        Map<String, Long> byStatus = employeeRepository.countActiveGroupedByStatus().stream()
                .collect(Collectors.toMap(
                        row -> row.getStatus().name(),
                        EmployeeRepository.StatusHeadcount::getEmployeeCount));

        YearMonth thisMonth = YearMonth.now();
        long newHires = employeeRepository.countByDeletedFalseAndJoiningDateBetween(
                thisMonth.atDay(1), thisMonth.atEndOfMonth());

        BigDecimal totalSalary = employeeRepository.sumActiveSalaries();

        Map<String, Long> headcountByDeptId = employeeRepository.countActiveGroupedByDepartment().stream()
                .collect(Collectors.toMap(
                        EmployeeRepository.DepartmentHeadcount::getDepartmentId,
                        EmployeeRepository.DepartmentHeadcount::getEmployeeCount));

        List<Department> departments = departmentRepository.findByDeletedFalseOrderByNameAsc();
        List<DashboardStatsResponse.DepartmentDistribution> distribution = departments.stream()
                .map(d -> DashboardStatsResponse.DepartmentDistribution.builder()
                        .departmentName(d.getName())
                        .employeeCount(headcountByDeptId.getOrDefault(d.getId(), 0L))
                        .build())
                .sorted(Comparator.comparingLong(DashboardStatsResponse.DepartmentDistribution::getEmployeeCount).reversed())
                .toList();

        List<Employee> topRecentHires = employeeRepository.findTop5ByDeletedFalseAndJoiningDateIsNotNullOrderByJoiningDateDesc();
        List<DashboardStatsResponse.RecentHire> recentHires = topRecentHires.stream()
                .map(e -> DashboardStatsResponse.RecentHire.builder()
                        .employeeId(e.getId())
                        .fullName(e.getFullName())
                        .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                        .designation(e.getDesignation())
                        .joiningDate(e.getJoiningDate().format(DateTimeFormatter.ISO_LOCAL_DATE))
                        .build())
                .toList();

        return DashboardStatsResponse.builder()
                .totalEmployees(totalEmployees)
                .activeEmployees(byStatus.getOrDefault(EmploymentStatus.ACTIVE.name(), 0L))
                .onLeaveEmployees(byStatus.getOrDefault(EmploymentStatus.ON_LEAVE.name(), 0L))
                .newHiresThisMonth(newHires)
                .totalMonthlySalary(totalSalary)
                .employeesByStatus(byStatus)
                .departmentDistribution(distribution)
                .recentHires(recentHires)
                .build();
    }
}
