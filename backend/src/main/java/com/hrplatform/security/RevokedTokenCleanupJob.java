package com.hrplatform.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class RevokedTokenCleanupJob {

    private final RevokedTokenRepository revokedTokenRepository;

    @Scheduled(cron = "0 0 3 * * *") // 3 AM daily
    @Transactional
    public void purgeExpired() {
        int deleted = revokedTokenRepository.deleteExpired(Instant.now());
        if (deleted > 0) {
            log.info("Purged {} expired revoked-token record(s)", deleted);
        }
    }
}