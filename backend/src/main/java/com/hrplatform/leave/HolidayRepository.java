package com.hrplatform.leave;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface HolidayRepository extends JpaRepository<Holiday, String> {
    List<Holiday> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);
    boolean existsByDate(LocalDate date);
}