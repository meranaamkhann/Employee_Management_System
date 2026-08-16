package com.hrplatform.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmployeeId(String employeeId);
    long countByRoleAndActiveTrue(UserRole role);
    Optional<User> findByResetToken(String resetToken);
}
