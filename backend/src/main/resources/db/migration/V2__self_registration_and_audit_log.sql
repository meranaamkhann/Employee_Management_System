-- ============================================================
-- v2: self-registration support, optimistic locking on
-- department, and the audit_log table for history retention.
-- ============================================================

ALTER TABLE app_user
    ADD COLUMN display_name VARCHAR(120);

ALTER TABLE department
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;

CREATE TABLE audit_log (
    id                  VARCHAR(36) PRIMARY KEY,
    entity_type         VARCHAR(30)  NOT NULL,
    entity_id           VARCHAR(36),
    action              VARCHAR(20)  NOT NULL,
    performed_by_email  VARCHAR(180) NOT NULL,
    performed_by_role   VARCHAR(20),
    summary             VARCHAR(500),
    created_at          TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_created_at ON audit_log (created_at);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);
