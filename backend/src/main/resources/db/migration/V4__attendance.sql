CREATE TABLE attendance_record (
    id          VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL REFERENCES employee (id),
    work_date   DATE         NOT NULL,
    clock_in    TIMESTAMP,
    clock_out   TIMESTAMP,
    status      VARCHAR(20)  NOT NULL,
    notes       VARCHAR(500),
    created_at  TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT now(),
    version     BIGINT       NOT NULL DEFAULT 0
);

-- One record per employee per day, enforced at the DB level, not just in code
CREATE UNIQUE INDEX idx_attendance_employee_date ON attendance_record (employee_id, work_date);
CREATE INDEX idx_attendance_date ON attendance_record (work_date);
CREATE INDEX idx_attendance_status ON attendance_record (status);