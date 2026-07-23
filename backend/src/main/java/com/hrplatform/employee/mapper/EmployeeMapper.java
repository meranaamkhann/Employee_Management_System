package com.hrplatform.employee.mapper;

import com.hrplatform.employee.Employee;
import com.hrplatform.employee.dto.EmployeeResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Entity -> response DTO mapping only. Request -> entity is assembled by
 * hand in EmployeeService because it requires repository lookups
 * (department, manager) that MapStruct cannot resolve on its own.
 */
@Mapper(componentModel = "spring")
public interface EmployeeMapper {

    @Mapping(target = "department", source = "department")
    @Mapping(target = "manager", source = "manager")
    EmployeeResponse toResponse(Employee employee);

    default EmployeeResponse.DepartmentSummary map(com.hrplatform.department.Department department) {
        if (department == null) return null;
        return EmployeeResponse.DepartmentSummary.builder()
                .id(department.getId())
                .name(department.getName())
                .build();
    }

    default EmployeeResponse.EmployeeSummary map(Employee manager) {
        if (manager == null) return null;
        return EmployeeResponse.EmployeeSummary.builder()
                .id(manager.getId())
                .fullName(manager.getFullName())
                .employeeCode(manager.getEmployeeCode())
                .build();
    }
}
