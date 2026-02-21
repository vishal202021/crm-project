package com.org.crm_service.dto;

import com.org.crm_service.dto.ContactDTO;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class CustomerDTO {

    @NotBlank(message="Customer name required")
    private String customerName;

    @NotBlank(message="Priority required")
    private String priority;

    @Min(value=1,message="Branches must be >=1")
    private Integer branches;

    @PastOrPresent
    private LocalDate leadGenerationDate;

    @Size(max=500)
    private String address;

    @Pattern(regexp="^[0-9]{6}$",message="Invalid pincode")
    private String pinCode;

    private String referenceBy;
    private String state;
    private String district;
    private String taluka;

    @NotEmpty(message="At least one contact required")
    private List<ContactDTO> contacts;
}
