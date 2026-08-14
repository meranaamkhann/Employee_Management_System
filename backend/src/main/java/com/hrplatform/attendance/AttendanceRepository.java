package com.hrplatform.attendance;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<AttendanceRecord, String>,
        JpaSpecificationExecutor<AttendanceRecord> {

    Optional<AttendanceRecord> findByEmployeeIdAndWorkDate(String employeeId, LocalDate workDate);

    /**
     * One aggregate query per employee/month instead of loading every row
     * and counting in Java — same pattern EmployeeRepository already uses
     * for dashboard stats and department headcounts.
     */
    @Query("""
            select a.status as status, count(a) as recordCount
            from AttendanceRecord a
            where a.employee.id = :employeeId and a.workDate between :from and :to
            group by a.status
            """)
    List<StatusCount> countGroupedByStatus(String employeeId, LocalDate from, LocalDate to);

    interface StatusCount {
        AttendanceStatus getStatus();
        long getRecordCount();
    }
}