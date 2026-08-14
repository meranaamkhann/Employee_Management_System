package com.hrplatform.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.web.PageableHandlerMethodArgumentResolverCustomizer;

/**
 * Without this, ?size=999999 on any list endpoint (employees, attendance,
 * leave, payroll) loads that many rows into memory in one query. One
 * global cap fixes it everywhere at once instead of validating page size
 * in every controller individually.
 */
@Configuration
public class WebConfig {

    @Bean
    public PageableHandlerMethodArgumentResolverCustomizer pageableCustomizer() {
        return resolver -> {
            resolver.setMaxPageSize(100);
            resolver.setFallbackPageable(PageRequest.of(0, 20));
        };
    }
}