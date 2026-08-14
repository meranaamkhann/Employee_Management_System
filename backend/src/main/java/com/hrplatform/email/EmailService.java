package com.hrplatform.email;

public interface EmailService {
    void sendPasswordResetEmail(String to, String recipientName, String resetLink);
}