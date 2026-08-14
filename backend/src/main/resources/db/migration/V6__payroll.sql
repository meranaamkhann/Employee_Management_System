CREATE TABLE payslip (
    id                     VARCHAR(36) PRIMARY KEY,
    employee_id            VARCHAR(36) NOT NULL REFERENCES employee (id),
    pay_month              VARCHAR(7)  NOT NULL, -- 'YYYY-MM'
    basic_salary           NUMERIC(14,2) NOT NULL,
    hra                    NUMERIC(14,2) NOT NULL,
    conveyance_allowance   NUMERIC(14,2) NOT NULL,
    special_allowance      NUMERIC(14,2) NOT NULL,
    gross_earnings         NUMERIC(14,2) NOT NULL,
    provident_fund         NUMERIC(14,2) NOT NULL,
    professional_tax       NUMERIC(14,2) NOT NULL,
    unpaid_leave_deduction NUMERIC(14,2) NOT NULL DEFAULT 0,
    bonus                  NUMERIC(14,2) NOT NULL DEFAULT 0,
    net_salary             NUMERIC(14,2) NOT NULL,
    status                 VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    generated_at           TIMESTAMP NOT NULL DEFAULT now(),
    paid_at                TIMESTAMP,
    notes                  VARCHAR(500),
    created_at             TIMESTAMP NOT NULL DEFAULT now(),
    updated_at             TIMESTAMP NOT NULL DEFAULT now(),
    version                BIGINT NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX idx_payslip_employee_month ON payslip (employee_id, pay_month);
CREATE INDEX idx_payslip_status ON payslip (status);