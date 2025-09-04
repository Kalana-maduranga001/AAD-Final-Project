package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PolicyDTO {
    private Integer id;
    private String checkInTime;
    private String checkOutTime;
    private String cancellationPolicy;
    private String additionalInfo;
}