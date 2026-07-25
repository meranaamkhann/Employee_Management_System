package com.hrplatform.audit;

import com.hrplatform.audit.dto.AuditLogResponse;
import com.hrplatform.common.ApiResponse;
import com.hrplatform.common.PageResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Audit Log", description = "History of who changed what, when")
@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN','IT_ADMIN')")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> list(
            @RequestParam(required = false) AuditEntityType entityType, Pageable pageable) {

        var page = entityType != null
                ? auditLogRepository.findByEntityTypeOrderByCreatedAtDesc(entityType, pageable)
                : auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);

        var mapped = page.getContent().stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page, mapped)));
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .action(log.getAction())
                .performedByEmail(log.getPerformedByEmail())
                .performedByRole(log.getPerformedByRole())
                .summary(log.getSummary())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
