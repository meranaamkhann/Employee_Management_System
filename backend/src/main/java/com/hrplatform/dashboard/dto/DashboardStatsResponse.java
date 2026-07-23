package com.hrplatform.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
public class DashboardStatsResponse {
    private long totalEmployees;
    private long activeEmployees;
    private long onLeaveEmployees;
    private long newHiresThisMonth;
    private BigDecimal totalMonthlySalary;
    private Map<String, Long> employeesByStatus;
    private List<DepartmentDistribution> departmentDistribution;
    private List<RecentHire> recentHires;

    @Getter
    @Builder
    @AllArgsConstructor
    public static class DepartmentDistribution {
        private String departmentName;
        private long employeeCount;
    }

    @Getter
    @Builder
    @AllArgsConstructor
    public static class RecentHire {
        private String employeeId;
        private String fullName;
        private String departmentName;
        private String designation;
        private String joiningDate;
    }
}
