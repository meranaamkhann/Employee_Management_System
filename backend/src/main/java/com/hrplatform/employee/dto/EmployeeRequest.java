package com.hrplatform.employee.dto;

import com.hrplatform.employee.EmploymentStatus;
import com.hrplatform.employee.Gender;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
public class EmployeeRequest {

    @NotBlank(message = "Full name is required")
    @Size(max = 120, message = "Full name must be under 120 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be a valid address")
    private String email;

    @Pattern(regexp = "^$|^[+]?[0-9\\-() ]{7,20}$", message = "Phone number is invalid")
    private String phone;

    private Gender gender;

    @Past(message = "Date of birth must be in the past")
    private LocalDate dateOfBirth;

    private String departmentId;

    @Size(max = 100)
    private String designation;

    private LocalDate joiningDate;

    @NotNull(message = "Salary is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Salary cannot be negative")
    private BigDecimal salary;

    private EmploymentStatus status;

    private String managerId;

    private String emergencyContactName;
    private String emergencyContactPhone;
    private String addressLine;
    private String city;
    private String country;
    private String photoUrl;

    @Size(max = 2000, message = "Notes must be under 2000 characters")
    private String notes;
}
