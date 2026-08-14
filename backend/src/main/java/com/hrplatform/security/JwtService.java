package com.hrplatform.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.Map;
import java.util.function.Function;
import java.util.UUID;

@Service
public class JwtService {

    private final SecretKey key;
    private final long accessTokenExpiryMs;
    private final long refreshTokenExpiryMs;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-expiry-ms}") long accessTokenExpiryMs,
            @Value("${app.jwt.refresh-token-expiry-ms}") long refreshTokenExpiryMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes());
        this.accessTokenExpiryMs = accessTokenExpiryMs;
        this.refreshTokenExpiryMs = refreshTokenExpiryMs;
    }

    public String generateAccessToken(String subjectEmail, String userId, String role) {
        return buildToken(subjectEmail, Map.of("uid", userId, "role", role, "type", "access"), accessTokenExpiryMs);
    }

    public String generateRefreshToken(String subjectEmail, String userId) {
        return buildToken(subjectEmail,
                Map.of("uid", userId, "type", "refresh", "jti", UUID.randomUUID().toString()),
                refreshTokenExpiryMs);
    }

    public String extractJti(String token) {
        return extractClaim(token, c -> c.get("jti", String.class));
    }

    public java.util.Date extractExpiry(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public java.util.Date extractIssuedAt(String token) {
        return extractClaim(token, Claims::getIssuedAt);
    }

    private String buildToken(String subject, Map<String, Object> claims, long expiryMs) {
        Date now = new Date();
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMs))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractTokenType(String token) {
        return extractClaim(token, c -> c.get("type", String.class));
    }

    public boolean isTokenValid(String token, String expectedEmail) {
        try {
            String email = extractEmail(token);
            return email.equals(expectedEmail) && !isExpired(token);
        } catch (ExpiredJwtException e) {
            return false;
        }
    }

    public boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser().verifyWith(key).build()
                .parseSignedClaims(token).getPayload();
        return resolver.apply(claims);
    }
}
