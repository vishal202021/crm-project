package com.org.crm_service.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;



    @Enumerated(EnumType.STRING)
    private UserStatus status;
}
