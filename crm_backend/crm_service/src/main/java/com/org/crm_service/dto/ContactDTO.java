package com.org.crm_service.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ContactDTO {

    @NotBlank(message="Contact name required")
    private String name;

    @Pattern(regexp="^[0-9]{10}$",message="Phone must be 10 digits")
    private String phone;

    private String position;
    private boolean primaryContact;
}
