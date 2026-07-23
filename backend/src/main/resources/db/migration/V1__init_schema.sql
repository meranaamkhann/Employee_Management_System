-- ============================================================
-- HR Platform - initial schema
-- department <-> employee has a circular FK (department.head
-- points to an employee, employee.department points to a
-- department) so the department->employee FK is added after
-- both tables exist.
-- ============================================================

CREATE TABLE department (
    id              VARCHAR(36) PRIMARY KEY,
    name            VARCHAR(100)  NOT NULL,
    description     VARCHAR(1000),
    head_employee_id VARCHAR(36),
    budget          NUMERIC(14, 2),
    deleted         BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP     NOT NULL DEFAULT now(),
    deleted_at      TIMESTAMP
);

CREATE UNIQUE INDEX idx_department_name ON department (name);

CREATE TABLE employee (
    id                      VARCHAR(36) PRIMARY KEY,
    employee_code           VARCHAR(20)  NOT NULL,
    full_name               VARCHAR(120) NOT NULL,
    email                   VARCHAR(180) NOT NULL,
    phone                   VARCHAR(20),
    gender                  VARCHAR(20),
    date_of_birth           DATE,
    department_id           VARCHAR(36) REFERENCES department (id),
    designation             VARCHAR(100),
    joining_date            DATE,
    salary                  NUMERIC(14, 2),
    status                  VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    manager_id              VARCHAR(36) REFERENCES employee (id),
    emergency_contact_name  VARCHAR(120),
    emergency_contact_phone VARCHAR(20),
    address_line            VARCHAR(300),
    city                    VARCHAR(100),
    country                 VARCHAR(100),
    photo_url               VARCHAR(500),
    notes                   VARCHAR(2000),
    deleted                 BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at              TIMESTAMP,
    created_at              TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at              TIMESTAMP    NOT NULL DEFAULT now(),
    version                 BIGINT       NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX idx_employee_code ON employee (employee_code);
CREATE UNIQUE INDEX idx_employee_email ON employee (email);
CREATE INDEX idx_employee_department ON employee (department_id);
CREATE INDEX idx_employee_manager ON employee (manager_id);
CREATE INDEX idx_employee_status ON employee (status);

ALTER TABLE department
    ADD CONSTRAINT fk_department_head FOREIGN KEY (head_employee_id) REFERENCES employee (id);

CREATE TABLE app_user (
    id                  VARCHAR(36) PRIMARY KEY,
    email               VARCHAR(180) NOT NULL,
    password_hash       VARCHAR(255) NOT NULL,
    role                VARCHAR(20)  NOT NULL,
    active              BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    employee_id         VARCHAR(36) REFERENCES employee (id),
    reset_token         VARCHAR(255),
    reset_token_expiry  TIMESTAMP,
    created_at          TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_email ON app_user (email);
