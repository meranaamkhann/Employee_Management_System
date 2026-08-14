package com.hrplatform.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory sliding-window limiter for the two endpoints worth throttling:
 * login (brute force) and forgot-password (Resend quota abuse / account
 * enumeration by timing). Deliberately NOT applied globally — every other
 * endpoint already sits behind JWT auth, a much stronger gate than rate
 * limiting would add.
 *
 * Known limitation, stated plainly: this is in-memory, so it only works
 * correctly for a single backend instance. That matches this project's
 * current single-instance Render deployment. Scaling to multiple instances
 * would need a shared store (Redis) — same pattern already used for the
 * URL shortener project's rate limiter.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> forgotPasswordBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String ip = clientIp(request);
        Bucket bucket = null;

        if (path.equals("/api/v1/auth/login")) {
            bucket = loginBuckets.computeIfAbsent(ip, k -> newBucket(5, Duration.ofMinutes(1)));
        } else if (path.equals("/api/v1/auth/forgot-password")) {
            bucket = forgotPasswordBuckets.computeIfAbsent(ip, k -> newBucket(3, Duration.ofMinutes(5)));
        }

        if (bucket != null && !bucket.tryConsume(1)) {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"success\":false,\"message\":\"Too many attempts. Please try again shortly.\",\"errorCode\":\"RATE_LIMIT_EXCEEDED\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private Bucket newBucket(int capacity, Duration period) {
        Bandwidth limit = Bandwidth.classic(capacity, Refill.greedy(capacity, period));
        return Bucket.builder().addLimit(limit).build();
    }

    private String clientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}