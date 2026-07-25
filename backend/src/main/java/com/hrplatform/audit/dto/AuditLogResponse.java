package com.hrplatform.audit.dto;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
@AllArgsConstructor
public class AuditLogResponse {
    private String id;
    private AuditEntityType entityType;
    private String entityId;
    private AuditAction action;
    private String performedByEmail;
    private String performedByRole;
    private String summary;
    private Instant createdAt;
}
