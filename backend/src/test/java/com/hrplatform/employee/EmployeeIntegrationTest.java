package com.hrplatform.employee;

import com.hrplatform.department.Department;
import com.hrplatform.department.DepartmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests using a real PostgreSQL container.
 *
 * These tests verify that:
 * - JPA mappings work against PostgreSQL
 * - Employee persistence works correctly
 * - Database-level unique constraints are enforced
 */
@Testcontainers
@SpringBootTest
@ActiveProfiles("test")
class EmployeeIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine");

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private DepartmentRepository departmentRepository;

    private Department department;

    @BeforeEach
    void setUp() {
        employeeRepository.deleteAll();
        departmentRepository.deleteAll();

        department = departmentRepository.saveAndFlush(
                Department.builder()
                        .name("Engineering")
                        .build()
        );
    }

    @Test
    @Transactional
    void savingEmployee_persistsAndReloadsCorrectly() {
        Employee employee = Employee.builder()
                .fullName("Asad Khan")
                .email("asad.khan@example.com")
                .employeeCode("EMP-000001")
                .department(department)
                .designation("Backend Engineer")
                .joiningDate(LocalDate.now())
                .status(EmploymentStatus.ACTIVE)
                .build();

        Employee saved = employeeRepository.saveAndFlush(employee);

        Employee reloaded = employeeRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getEmail())
                .isEqualTo("asad.khan@example.com");

        assertThat(reloaded.getDepartment())
                .isNotNull();

        assertThat(reloaded.getDepartment().getName())
                .isEqualTo("Engineering");
    }

    @Test
    void duplicateEmployeeCode_violatesUniqueConstraintAtDbLevel() {
        Employee first = Employee.builder()
                .fullName("Alice")
                .email("alice@example.com")
                .employeeCode("EMP-000002")
                .department(department)
                .status(EmploymentStatus.ACTIVE)
                .build();

        employeeRepository.saveAndFlush(first);

        Employee duplicate = Employee.builder()
                .fullName("Bob")
                .email("bob@example.com")
                .employeeCode("EMP-000002")
                .department(department)
                .status(EmploymentStatus.ACTIVE)
                .build();

        assertThatThrownBy(() ->
                employeeRepository.saveAndFlush(duplicate)
        ).isInstanceOf(DataIntegrityViolationException.class);
    }
}