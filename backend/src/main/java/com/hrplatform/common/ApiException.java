package com.hrplatform.common;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base class for all business-rule exceptions. Carries an HTTP status and a
 * stable ErrorCode so GlobalExceptionHandler never has to guess how to
 * translate a failure into a response.
 */
@Getter
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final ErrorCode errorCode;

    public ApiException(HttpStatus status, ErrorCode errorCode, String message) {
        super(message);
        this.status = status;
        this.errorCode = errorCode;
    }

    public static ApiException notFound(String message) {
        return new ApiException(HttpStatus.NOT_FOUND, ErrorCode.RESOURCE_NOT_FOUND, message);
    }

    public static ApiException conflict(ErrorCode code, String message) {
        return new ApiException(HttpStatus.CONFLICT, code, message);
    }

    public static ApiException badRequest(ErrorCode code, String message) {
        return new ApiException(HttpStatus.BAD_REQUEST, code, message);
    }

    public static ApiException forbidden(ErrorCode code, String message) {
        return new ApiException(HttpStatus.FORBIDDEN, code, message);
    }

    public static ApiException unauthorized(ErrorCode code, String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, code, message);
    }
}
