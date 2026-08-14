CREATE TABLE revoked_token (
    jti        VARCHAR(64) PRIMARY KEY,
    expires_at TIMESTAMP NOT NULL
);
CREATE INDEX idx_revoked_token_expiry ON revoked_token (expires_at);