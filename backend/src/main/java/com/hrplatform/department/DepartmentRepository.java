package com.hrplatform.department;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, String> {
    List<Department> findByDeletedFalseOrderByNameAsc();
    Optional<Department> findByIdAndDeletedFalse(String id);
    boolean existsByNameIgnoreCaseAndDeletedFalse(String name);
    boolean existsByNameIgnoreCaseAndIdNotAndDeletedFalse(String name, String id);
}
