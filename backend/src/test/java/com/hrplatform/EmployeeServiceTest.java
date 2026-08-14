package com.hrplatform.employee;

import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.department.DepartmentRepository;
import com.hrplatform.employee.dto.EmployeeRequest;
import com.hrplatform.employee.mapper.EmployeeMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private EmployeeMapper employeeMapper;
    @Mock private AuditService auditService;

    @InjectMocks
    private EmployeeService employeeService;

    private Employee makeEmployee(String id, String name) {
        Employee e = new Employee();
        e.setId(id);
        e.setFullName(name);
        e.setEmail(name.toLowerCase().replace(" ", ".") + "@company.com");
        e.setEmployeeCode("EMP-00000" + id);
        return e;
    }

    private EmployeeRequest baseRequest() {
        EmployeeRequest req = new EmployeeRequest();
        req.setFullName("Asad Khan");
        req.setEmail("asad.khan@company.com");
        req.setDesignation("Backend Engineer");
        req.setJoiningDate(LocalDate.now());
        req.setSalary(new BigDecimal("50000"));
        req.setStatus(EmploymentStatus.ACTIVE);
        return req;
    }

    // ---- self-as-own-manager -------------------------------------------

    @Test
    void update_rejectsSelfAsManager() {
        Employee existing = makeEmployee("1", "Asad Khan");
        when(employeeRepository.findByIdAndDeletedFalse("1")).thenReturn(Optional.of(existing));
        when(employeeRepository.existsByEmailIgnoreCaseAndIdNotAndDeletedFalse(anyString(), anyString()))
                .thenReturn(false);

        EmployeeRequest req = baseRequest();
        req.setManagerId("1"); // same as own id

        assertThatThrownBy(() -> employeeService.update("1", req))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SELF_MANAGER_FORBIDDEN);
    }

    // ---- circular hierarchy ----------------------------------------------

    @Test
    void update_rejectsCircularHierarchy() {
        // A -> manager B, now trying to set B's manager = A -> cycle
        Employee employeeA = makeEmployee("A", "Alice");
        Employee employeeB = makeEmployee("B", "Bob");
        employeeB.setManager(employeeA); // B currently reports to A

        when(employeeRepository.findByIdAndDeletedFalse("A")).thenReturn(Optional.of(employeeA));
        when(employeeRepository.findByIdAndDeletedFalse("B")).thenReturn(Optional.of(employeeB));
        when(employeeRepository.existsByEmailIgnoreCaseAndIdNotAndDeletedFalse(anyString(), anyString()))
                .thenReturn(false);

        EmployeeRequest req = baseRequest();
        req.setManagerId("B"); // try to make A report to B, while B reports to A

        assertThatThrownBy(() -> employeeService.update("A", req))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.CIRCULAR_HIERARCHY);
    }

    @Test
    void update_allowsValidManagerReassignment() {
        Employee employee = makeEmployee("1", "Asad Khan");
        Employee manager = makeEmployee("2", "Team Lead");

        when(employeeRepository.findByIdAndDeletedFalse("1")).thenReturn(Optional.of(employee));
        when(employeeRepository.findByIdAndDeletedFalse("2")).thenReturn(Optional.of(manager));
        when(employeeRepository.existsByEmailIgnoreCaseAndIdNotAndDeletedFalse(anyString(), anyString()))
                .thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));
        when(employeeMapper.toResponse(any(Employee.class))).thenReturn(null);

        EmployeeRequest req = baseRequest();
        req.setManagerId("2");

        employeeService.update("1", req);

        verify(employeeRepository).save(argThat(e -> e.getManager() != null && e.getManager().getId().equals("2")));
    }

    // ---- duplicate email / phone -------------------------------------------

    @Test
    void create_rejectsDuplicateEmail() {
        when(employeeRepository.existsByEmailIgnoreCaseAndDeletedFalse(anyString())).thenReturn(true);

        assertThatThrownBy(() -> employeeService.create(baseRequest()))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_EMAIL);

        verify(employeeRepository, never()).save(any());
    }

    @Test
    void create_rejectsDuplicatePhone() {
        EmployeeRequest req = baseRequest();
        req.setPhone("9999999999");

        when(employeeRepository.existsByEmailIgnoreCaseAndDeletedFalse(anyString())).thenReturn(false);
        when(employeeRepository.existsByPhoneAndDeletedFalse("9999999999")).thenReturn(true);

        assertThatThrownBy(() -> employeeService.create(req))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_PHONE);
    }

    // ---- self delete / bulk self delete ------------------------------------

    @Test
    void softDelete_rejectsSelfDelete() {
        Employee employee = makeEmployee("1", "Asad Khan");
        when(employeeRepository.findByIdAndDeletedFalse("1")).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> employeeService.softDelete("1", "1"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SELF_DELETE_FORBIDDEN);

        verify(employeeRepository, never()).save(any());
    }

    @Test
    void softDelete_marksDeletedAndRecordsAudit() {
        Employee employee = makeEmployee("1", "Asad Khan");
        when(employeeRepository.findByIdAndDeletedFalse("1")).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        employeeService.softDelete("1", "2"); // deleted by someone else

        assertThat(employee.isDeleted()).isTrue();
        assertThat(employee.getDeletedAt()).isNotNull();
        verify(auditService).record(any(), eq("1"), any(), anyString());
    }

    @Test
    void bulkSoftDelete_rejectsWhenRequesterInList() {
        assertThatThrownBy(() -> employeeService.bulkSoftDelete(java.util.List.of("1", "2"), "2"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.SELF_DELETE_FORBIDDEN);

        verify(employeeRepository, never()).findAllById(any());
    }

    // ---- restore ------------------------------------------------------------

    @Test
    void restore_rejectsWhenNotDeleted() {
        Employee employee = makeEmployee("1", "Asad Khan");
        employee.setDeleted(false);
        when(employeeRepository.findById("1")).thenReturn(Optional.of(employee));

        assertThatThrownBy(() -> employeeService.restore("1"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.CONFLICT);
    }

    @Test
    void restore_clearsDeletedFlagAndTimestamp() {
        Employee employee = makeEmployee("1", "Asad Khan");
        employee.setDeleted(true);
        employee.setDeletedAt(java.time.Instant.now());
        when(employeeRepository.findById("1")).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        employeeService.restore("1");

        assertThat(employee.isDeleted()).isFalse();
        assertThat(employee.getDeletedAt()).isNull();
    }


    @Test
    void create_retriesEmployeeCodeOnCollision() {
        when(employeeRepository.existsByEmailIgnoreCaseAndDeletedFalse(anyString())).thenReturn(false);
        when(employeeRepository.count()).thenReturn(0L);
        // first candidate EMP-000001 collides, second EMP-000002 is free
        when(employeeRepository.existsByEmployeeCodeIgnoreCase("EMP-000001")).thenReturn(true);
        when(employeeRepository.existsByEmployeeCodeIgnoreCase("EMP-000002")).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        employeeService.create(baseRequest());

        verify(employeeRepository).save(argThat(e -> "EMP-000002".equals(e.getEmployeeCode())));
    }
}