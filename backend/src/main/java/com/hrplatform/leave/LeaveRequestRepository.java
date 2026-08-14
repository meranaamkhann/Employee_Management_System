package com.hrplatform.leave;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, String>,
        JpaSpecificationExecutor<LeaveRequest> {

    @Query("""
            select r from LeaveRequest r
            where r.employee.id = :employeeId
              and r.status in ('PENDING', 'APPROVED')
              and r.startDate <= :endDate and r.endDate >= :startDate
            """)
    List<LeaveRequest> findOverlapping(String employeeId, LocalDate startDate, LocalDate endDate);
}