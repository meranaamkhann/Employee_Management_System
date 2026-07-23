package com.hrplatform.employee.dto;

import com.hrplatform.employee.EmploymentStatus;
import com.hrplatform.employee.Gender;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmployeeResponse {
    private String id;
    private String employeeCode;
    private String fullName;
    private String email;
    private String phone;
    private Gender gender;
    private LocalDate dateOfBirth;
    private DepartmentSummary department;
    private String designation;
    private LocalDate joiningDate;
    private BigDecimal salary;
    private EmploymentStatus status;
    private EmployeeSummary manager;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String addressLine;
    private String city;
    private String country;
    private String photoUrl;
    private String notes;
    private Instant createdAt;
    private Instant updatedAt;

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentSummary {
        private String id;
        private String name;
    }

    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmployeeSummary {
        private String id;
        private String fullName;
        private String employeeCode;
    }
}
