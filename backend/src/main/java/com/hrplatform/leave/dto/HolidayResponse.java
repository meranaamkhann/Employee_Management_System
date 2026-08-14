package com.hrplatform.leave.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class HolidayResponse {
    private String id;
    private LocalDate date;
    private String name;
}