package com.hrplatform.common;

import lombok.Getter;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * Flattened pagination envelope so the frontend deals with plain fields
 * instead of Spring's native Page serialization (which leaks internals like
 * "pageable" and "sort" objects into the API contract).
 */
@Getter
public class PageResponse<T> {
    private final List<T> content;
    private final int page;
    private final int size;
    private final long totalElements;
    private final int totalPages;
    private final boolean last;

    private PageResponse(List<T> content, int page, int size, long totalElements, int totalPages, boolean last) {
        this.content = content;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.totalPages = totalPages;
        this.last = last;
    }

    public static <T> PageResponse<T> of(Page<T> source) {
        return new PageResponse<>(source.getContent(), source.getNumber(), source.getSize(),
                source.getTotalElements(), source.getTotalPages(), source.isLast());
    }

    public static <T, U> PageResponse<U> of(Page<T> source, List<U> mappedContent) {
        return new PageResponse<>(mappedContent, source.getNumber(), source.getSize(),
                source.getTotalElements(), source.getTotalPages(), source.isLast());
    }
}
