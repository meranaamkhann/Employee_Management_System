package com.hrplatform.leave;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, String> {
    Optional<LeaveBalance> findByEmployeeIdAndLeaveTypeAndYear(String employeeId, LeaveType leaveType, int year);
    List<LeaveBalance> findByEmployeeIdAndYear(String employeeId, int year);
}