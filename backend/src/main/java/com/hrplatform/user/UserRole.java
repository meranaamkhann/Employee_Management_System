package com.hrplatform.user;

/**
 * ADMIN and IT_ADMIN are deliberately separate: ADMIN owns HR data
 * (employees, departments, payroll visibility), IT_ADMIN owns account
 * provisioning (who can log in, what role they hold) but has no access to
 * HR data itself. This separation-of-duties split is standard in real HRIS
 * deployments and means a compromised IT/helpdesk account can't read salary
 * or personal data, and a compromised HR account can't create new logins.
 */
public enum UserRole {
    ADMIN,
    IT_ADMIN,
    HR,
    MANAGER,
    EMPLOYEE
}
