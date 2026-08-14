package com.hrplatform.leave.dto;

import com.hrplatform.leave.LeaveType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LeaveBalanceResponse {
    private LeaveType leaveType;
    private int year;
    private int allocatedDays;
    private int usedDays;
    private int remainingDays;
}