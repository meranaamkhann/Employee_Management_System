package com.hrplatform.dashboard;

import com.hrplatform.dashboard.dto.DashboardStatsResponse;
import com.hrplatform.department.Department;
import com.hrplatform.department.DepartmentRepository;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmploymentStatus;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.employee.EmployeeSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getStats() {
        Specification<Employee> notDeleted = EmployeeSpecifications.notDeleted();
        List<Employee> employees = employeeRepository.findAll(notDeleted);

        Map<String, Long> byStatus = employees.stream()
                .collect(Collectors.groupingBy(e -> e.getStatus().name(), Collectors.counting()));

        YearMonth thisMonth = YearMonth.now();
        long newHires = employees.stream()
                .filter(e -> e.getJoiningDate() != null && YearMonth.from(e.getJoiningDate()).equals(thisMonth))
                .count();

        BigDecimal totalSalary = employees.stream()
                .filter(e -> e.getStatus() == EmploymentStatus.ACTIVE && e.getSalary() != null)
                .map(Employee::getSalary)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<Department> departments = departmentRepository.findByDeletedFalseOrderByNameAsc();
        List<DashboardStatsResponse.DepartmentDistribution> distribution = departments.stream()
                .map(d -> DashboardStatsResponse.DepartmentDistribution.builder()
                        .departmentName(d.getName())
                        .employeeCount(employeeRepository.countByDepartmentIdAndDeletedFalse(d.getId()))
                        .build())
                .sorted(Comparator.comparingLong(DashboardStatsResponse.DepartmentDistribution::getEmployeeCount).reversed())
                .toList();

        List<DashboardStatsResponse.RecentHire> recentHires = employees.stream()
                .filter(e -> e.getJoiningDate() != null)
                .sorted(Comparator.comparing(Employee::getJoiningDate).reversed())
                .limit(5)
                .map(e -> DashboardStatsResponse.RecentHire.builder()
                        .employeeId(e.getId())
                        .fullName(e.getFullName())
                        .departmentName(e.getDepartment() != null ? e.getDepartment().getName() : null)
                        .designation(e.getDesignation())
                        .joiningDate(e.getJoiningDate().format(DateTimeFormatter.ISO_LOCAL_DATE))
                        .build())
                .toList();

        return DashboardStatsResponse.builder()
                .totalEmployees(employees.size())
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
