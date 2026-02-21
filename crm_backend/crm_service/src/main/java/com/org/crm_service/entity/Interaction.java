package com.org.crm_service.entity;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
public class Interaction {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    private LocalDate interactionDate;

    @Column(length=2000)
    private String followupDetails;

    private LocalDate nextFollowupDate;

    private String status;
    private String callBy;
    private String visitedBy;
    private String callingType;

    @Column(nullable=false)
    private Boolean deleted=false;

    @Column(nullable = false)
    private Boolean reminderSent = false;


    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @PrePersist
    public void prePersist(){
        if(interactionDate == null){
            interactionDate = LocalDate.now();
        }
    }

}
