package com.cloverinfotech.employeemanager.employee_service.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Send password reset email. Returns true if sent, false if mail not configured.
     */
    public boolean sendPasswordResetEmail(String toEmail, String resetToken) {
        if (toEmail == null || toEmail.isBlank()) return false;
        if (fromEmail == null || fromEmail.isBlank()) {
            return false; // Mail not configured
        }
        String resetLink = frontendUrl + "/reset-password?token=" + resetToken;
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("Reset your password – Employee Manager");
        message.setText(
            "You requested a password reset for Employee Manager.\n\n" +
            "Click the link below to set a new password (link expires in 1 hour):\n\n" +
            resetLink + "\n\n" +
            "If you didn't request this, you can ignore this email.\n\n" +
            "— Clover Infotech Employee Manager"
        );
        mailSender.send(message);
        return true;
    }

    public String buildResetLink(String resetToken) {
        return frontendUrl + "/reset-password?token=" + resetToken;
    }
}
