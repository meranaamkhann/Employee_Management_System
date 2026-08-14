package com.hrplatform.email;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResendEmailService implements EmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final MailProperties mailProperties;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void sendPasswordResetEmail(String to, String recipientName, String resetLink) {
        if (mailProperties.getResendApiKey() == null || mailProperties.getResendApiKey().isBlank()) {
            // No API key configured (e.g. running locally without a Resend account) — fall
            // back to logging so the flow can still be exercised end-to-end without external
            // infra, same escape hatch the original mock implementation gave you.
            log.info("[EMAIL DISABLED - no RESEND_API_KEY set] Password reset link for {}: {}", to, resetLink);
            return;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(mailProperties.getResendApiKey());
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "from", mailProperties.getFromName() + " <" + mailProperties.getFromAddress() + ">",
                "to", List.of(to),
                "subject", "Reset your Rosterly password",
                "html", buildResetEmailHtml(recipientName, resetLink)
        );

        try {
            restTemplate.postForEntity(RESEND_API_URL, new HttpEntity<>(body, headers), String.class);
            log.info("Password reset email sent to {}", to);
        } catch (Exception e) {
            // A delivery failure should never break the forgot-password flow for the caller
            // (they already get the same generic response either way, so as not to leak
            // account existence) — but it must be visible in logs, not silently swallowed.
            log.error("Failed to send password reset email to {}: {}", to, e.getMessage());
        }
    }

    private String buildResetEmailHtml(String recipientName, String resetLink) {
        return """
                <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
                  <h2 style="color: #1a1a1a;">Reset your password</h2>
                  <p>Hi %s,</p>
                  <p>We received a request to reset your Rosterly password. This link expires in 30 minutes.</p>
                  <p style="margin: 24px 0;">
                    <a href="%s" style="background:#1a1a1a;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">
                      Reset password
                    </a>
                  </p>
                  <p style="color:#666;font-size:13px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
                </div>
                """.formatted(recipientName, resetLink);
    }
}