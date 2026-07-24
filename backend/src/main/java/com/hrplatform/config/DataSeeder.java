package com.hrplatform.config;

import com.hrplatform.department.Department;
import com.hrplatform.department.DepartmentRepository;
import com.hrplatform.employee.Employee;
import com.hrplatform.employee.EmployeeRepository;
import com.hrplatform.employee.EmploymentStatus;
import com.hrplatform.employee.Gender;
import com.hrplatform.user.User;
import com.hrplatform.user.UserRepository;
import com.hrplatform.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Runs once on every startup and is fully idempotent: it only creates the
 * default admin (and a small demo dataset, dev profile only) if the
 * database is genuinely empty. Safe to leave enabled in every environment.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.seed.admin-email:admin@hrplatform.local}")
    private String adminEmail;

    @Value("${app.seed.admin-password:ChangeMe@2026}")
    private String adminPassword;

    @Value("${app.seed.demo-data:true}")
    private boolean seedDemoData;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        if (seedDemoData && departmentRepository.count() == 0) {
            seedDemoDataset();
        }
    }

    private void seedAdmin() {
    User admin = userRepository.findByEmailIgnoreCase(adminEmail).orElse(null);

    if (admin == null) {
        admin = User.builder()
                .email(adminEmail)
                .role(UserRole.ADMIN)
                .active(true)
                .emailVerified(true)
                .build();
    }

    admin.setActive(true);
    admin.setEmailVerified(true);
    admin.setRole(UserRole.ADMIN);
    admin.setPasswordHash(passwordEncoder.encode(adminPassword));

    userRepository.save(admin);

    log.info("Admin account ensured: {}", adminEmail);
}

    private void seedDemoDataset() {
        Department engineering = departmentRepository.save(Department.builder()
                .name("Engineering")
                .description("Builds and maintains the product.")
                .budget(new BigDecimal("450000"))
                .build());

        Department people = departmentRepository.save(Department.builder()
                .name("People Operations")
                .description("Hiring, onboarding, and employee experience.")
                .budget(new BigDecimal("180000"))
                .build());

        Employee vpEng = employeeRepository.save(Employee.builder()
                .employeeCode("EMP-000001")
                .fullName("Priya Nair")
                .email("priya.nair@hrplatform.local")
                .gender(Gender.FEMALE)
                .department(engineering)
                .designation("VP of Engineering")
                .joiningDate(LocalDate.of(2021, 3, 1))
                .salary(new BigDecimal("185000"))
                .status(EmploymentStatus.ACTIVE)
                .build());

        employeeRepository.save(Employee.builder()
                .employeeCode("EMP-000002")
                .fullName("Daniel Cho")
                .email("daniel.cho@hrplatform.local")
                .gender(Gender.MALE)
                .department(engineering)
                .designation("Senior Backend Engineer")
                .joiningDate(LocalDate.of(2022, 7, 18))
                .salary(new BigDecimal("142000"))
                .status(EmploymentStatus.ACTIVE)
                .manager(vpEng)
                .build());

        employeeRepository.save(Employee.builder()
                .employeeCode("EMP-000003")
                .fullName("Amara Obi")
                .email("amara.obi@hrplatform.local")
                .gender(Gender.FEMALE)
                .department(people)
                .designation("HR Business Partner")
                .joiningDate(LocalDate.of(2023, 1, 9))
                .salary(new BigDecimal("98000"))
                .status(EmploymentStatus.ACTIVE)
                .build());

        log.info("Seeded demo dataset: 2 departments, 3 employees.");
    }
}
