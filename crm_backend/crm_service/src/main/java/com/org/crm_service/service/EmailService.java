package com.org.crm_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

   private final JavaMailSender javaMailSender;

    public void send(String to,String company,String msgText,String status){
        SimpleMailMessage msg=new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("Follow-up Reminder");
        msg.setText(
                "Follow up with "+company+
                        "\n\nLast discussion: " +msgText +
                        "\nStatus: " + status
        );
        javaMailSender.send(msg);
    }
}
