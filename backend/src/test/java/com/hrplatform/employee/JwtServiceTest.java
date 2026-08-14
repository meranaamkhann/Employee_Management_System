package com.hrplatform.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        // 256-bit+ secret required by HMAC-SHA — matches app.jwt.secret format in application.yml
        jwtService = new JwtService(
                "test-secret-key-for-jwt-signing-minimum-256-bits-long-enough",
                900_000L,      // 15 min access token
                604_800_000L   // 7 day refresh token
        );
    }

    @Test
    void generateAccessToken_embedsCorrectClaims() {
        String token = jwtService.generateAccessToken("asad@company.com", "user-1", "ADMIN");

        assertThat(jwtService.extractEmail(token)).isEqualTo("asad@company.com");
        assertThat(jwtService.extractTokenType(token)).isEqualTo("access");
        assertThat(jwtService.isExpired(token)).isFalse();
    }

    @Test
    void generateRefreshToken_hasRefreshType() {
        String token = jwtService.generateRefreshToken("asad@company.com", "user-1");

        assertThat(jwtService.extractTokenType(token)).isEqualTo("refresh");
    }

    @Test
    void isTokenValid_trueForMatchingEmailAndUnexpiredToken() {
        String token = jwtService.generateAccessToken("asad@company.com", "user-1", "ADMIN");

        assertThat(jwtService.isTokenValid(token, "asad@company.com")).isTrue();
    }

    @Test
    void isTokenValid_falseForMismatchedEmail() {
        String token = jwtService.generateAccessToken("asad@company.com", "user-1", "ADMIN");

        assertThat(jwtService.isTokenValid(token, "someone-else@company.com")).isFalse();
    }

    @Test
    void isTokenValid_falseForExpiredToken() throws InterruptedException {
        JwtService shortLived = new JwtService(
                "test-secret-key-for-jwt-signing-minimum-256-bits-long-enough",
                1L,   // expires almost immediately
                604_800_000L
        );
        String token = shortLived.generateAccessToken("asad@company.com", "user-1", "ADMIN");
        Thread.sleep(50);

        assertThat(shortLived.isTokenValid(token, "asad@company.com")).isFalse();
    }
}