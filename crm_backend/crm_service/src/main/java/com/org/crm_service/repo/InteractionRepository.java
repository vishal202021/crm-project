package com.org.crm_service.repo;

import com.org.crm_service.dto.TodayFollowupDTO;
import com.org.crm_service.entity.Customer;
import com.org.crm_service.entity.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction,Long> {
    List<Interaction> findByCustomerIdAndDeletedFalseOrderByInteractionDateDesc(Long id);

    List<Interaction> findByNextFollowupDateAndReminderSentFalseAndDeletedFalse(LocalDate nextFollowupDate);
    Interaction findTopByCustomerAndDeletedFalseOrderByIdDesc(Customer customer);

    @Query("""
SELECT new com.org.crm_service.dto.TodayFollowupDTO(
 i.id,
 c.id,
 c.customerName,
 c.contactNo,
 c.contactName,
 c.position,
 i.status,
 i.nextFollowupDate
)
FROM Interaction i
JOIN i.customer c
WHERE i.deleted=false
AND i.id IN (
   SELECT MAX(i2.id)
   FROM Interaction i2
   WHERE i2.deleted=false
   GROUP BY i2.customer.id
)
AND i.nextFollowupDate=CURRENT_DATE
""")
    List<TodayFollowupDTO> findTodayFollowups();

    Optional<Interaction>
    findByIdAndDeletedFalse(Long id);
    List<Interaction> findByDeletedFalse();


    Interaction findTopByCustomerOrderByIdDesc(Customer c);

    List<Interaction> findByNextFollowupDateAndReminderSentFalse(LocalDate now);
}
