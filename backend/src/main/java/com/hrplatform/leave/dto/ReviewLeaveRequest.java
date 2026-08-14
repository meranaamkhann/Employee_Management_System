package com.hrplatform.leave.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReviewLeaveRequest {
    @Size(max = 500)
    private String note;
}