package com.org.crm_service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

@Data
public class InteractionDTO {

    @NotNull(message="Customer ID required")
    private Long customerId;

    private LocalDate interactionDate;

    @Size(max=2000,message="Details too long")
    private String followupDetails;

    private LocalDate nextFollowupDate;

    @NotBlank(message="Status required")
    private String status;

    private String callBy;
    private String visitedBy;
    private String callingType;
}

