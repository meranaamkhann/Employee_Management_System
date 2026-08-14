package com.hrplatform.common;

/**
 * Stable machine-readable error codes returned alongside HTTP status codes.
 * The frontend matches on these (not on message text) to decide how to
 * react to a given failure, e.g. redirect to login on AUTH_TOKEN_EXPIRED.
 */
public enum ErrorCode {
    VALIDATION_FAILED,
    RESOURCE_NOT_FOUND,
    DUPLICATE_EMAIL,
    DUPLICATE_PHONE,
    DUPLICATE_EMPLOYEE_CODE,
    INVALID_CREDENTIALS,
    AUTH_TOKEN_EXPIRED,
    AUTH_TOKEN_INVALID,
    ACCESS_DENIED,
    SELF_DELETE_FORBIDDEN,
    LAST_ADMIN_FORBIDDEN,
    SELF_MANAGER_FORBIDDEN,
    CIRCULAR_HIERARCHY,
    DEPARTMENT_NOT_EMPTY,
    CONFLICT,
    INTERNAL_ERROR,
    INVALID_FILE_TYPE,
    FILE_TOO_LARGE
}
