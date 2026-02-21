package com.org.crm_service.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
public class Customer {

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String priority;
    private Integer branches;
    private LocalDate leadGenerationDate;

    private String address;
    private String pinCode;


    private String contactName;
    private String contactNo;
    private String position;

    private String referenceBy;
    private String state;
    private String district;
    private String taluka;




    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdDate;

    private Boolean deleted = false;

    @OneToMany(mappedBy="customer",
            cascade=CascadeType.ALL,
            orphanRemoval=true)
    private List<Contact> contacts = new ArrayList<>();

    @OneToMany(mappedBy="customer",
            cascade=CascadeType.ALL,
            orphanRemoval=true)
    @JsonIgnore
    private List<Interaction> interactions;
}
