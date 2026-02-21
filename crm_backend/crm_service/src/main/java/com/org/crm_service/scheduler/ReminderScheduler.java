package com.org.crm_service.scheduler;
import com.org.crm_service.entity.Interaction;
import com.org.crm_service.repo.InteractionRepository;
import com.org.crm_service.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.time.LocalDate;
import java.util.List;

@Component
@EnableScheduling
@RequiredArgsConstructor
public class ReminderScheduler {

   private final InteractionRepository repository;
   private final EmailService email;


    @Scheduled(cron = "0 0 9 * * ?")
    public void send() {
        System.out.println("Scheduler running...");

        List<Interaction> list =
                repository.findByNextFollowupDateAndReminderSentFalse(LocalDate.now());


        for (Interaction i : list) {
            System.out.println(i.getCustomer().getCustomerName()+" "+ i.getFollowupDetails());
            email.send(
                    "vishaljadhav55429@gmail.com",
                    i.getCustomer().getCustomerName(),
                    i.getFollowupDetails(),
                    i.getStatus()
            );
            i.setReminderSent(true);
            repository.save(i);


        }
    }

//    @Scheduled(cron = "0 0 9 * * ?")
//    public void autoSend(){
//        send();
//    }
}
