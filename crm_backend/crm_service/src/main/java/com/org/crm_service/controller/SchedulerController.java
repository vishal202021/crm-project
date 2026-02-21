package com.org.crm_service.controller;
import com.org.crm_service.scheduler.ReminderScheduler;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/test")
public class SchedulerController {

    private final ReminderScheduler scheduler;

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/send-mail")
    public String testMail() {
        scheduler.send();
        return "Emails Sent!";
    }
}

