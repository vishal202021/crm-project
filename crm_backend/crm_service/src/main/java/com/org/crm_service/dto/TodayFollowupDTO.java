package com.org.crm_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TodayFollowupDTO {

    private Long interactionId;

    private Long customerId;
    private String customerName;
    private String mobileNo;
    private String contactName;
    private String position;

    private String status;
    private LocalDate nextFollowupDate;
}

