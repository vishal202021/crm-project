package com.org.crm_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CustomerSummaryDTO {
    private Long id;
    private String customerName;
    private String contactName;
    private String contactNo;
    private String priority;
    private String status;
    private LocalDate nextFollowupDate;
    private String city;
    private LocalDateTime createdDate;
    private Long interactionId;
}
