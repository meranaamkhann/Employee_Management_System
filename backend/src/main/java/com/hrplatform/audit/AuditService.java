package com.hrplatform.audit;

import com.hrplatform.security.SecurityUtils;
import com.hrplatform.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Runs in its own transaction (REQUIRES_NEW) so that a failure writing
     * an audit row can never roll back the business change it's describing,
     * and — just as importantly — the audit row still commits even if
     * something later in the same request fails.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(AuditEntityType entityType, String entityId, AuditAction action, String summary) {
        UserPrincipal actor = SecurityUtils.currentUser();
        AuditLog log = AuditLog.builder()
                .entityType(entityType)
                .entityId(entityId)
                .action(action)
                .performedByEmail(actor != null ? actor.getEmail() : "system")
                .performedByRole(actor != null ? actor.getRole() : null)
                .summary(summary)
                .build();
        auditLogRepository.save(log);
    }
}
