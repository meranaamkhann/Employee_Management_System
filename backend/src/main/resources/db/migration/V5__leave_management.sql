CREATE TABLE leave_balance (
    id             VARCHAR(36) PRIMARY KEY,
    employee_id    VARCHAR(36) NOT NULL REFERENCES employee (id),
    leave_type     VARCHAR(20) NOT NULL,
    year           INT         NOT NULL,
    allocated_days INT         NOT NULL,
    used_days      INT         NOT NULL DEFAULT 0,
    created_at     TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT now(),
    version        BIGINT      NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_leave_balance_emp_type_year ON leave_balance (employee_id, leave_type, year);

CREATE TABLE leave_request (
    id             VARCHAR(36) PRIMARY KEY,
    employee_id    VARCHAR(36) NOT NULL REFERENCES employee (id),
    leave_type     VARCHAR(20) NOT NULL,
    start_date     DATE        NOT NULL,
    end_date       DATE        NOT NULL,
    number_of_days INT         NOT NULL,
    reason         VARCHAR(500),
    status         VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by_id VARCHAR(36) REFERENCES employee (id),
    review_note    VARCHAR(500),
    created_at     TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP   NOT NULL DEFAULT now(),
    version        BIGINT      NOT NULL DEFAULT 0
);
CREATE INDEX idx_leave_request_employee ON leave_request (employee_id);
CREATE INDEX idx_leave_request_status ON leave_request (status);
CREATE INDEX idx_leave_request_dates ON leave_request (start_date, end_date);

CREATE TABLE holiday (
    id           VARCHAR(36) PRIMARY KEY,
    holiday_date DATE         NOT NULL,
    name         VARCHAR(150) NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_holiday_date ON holiday (holiday_date);