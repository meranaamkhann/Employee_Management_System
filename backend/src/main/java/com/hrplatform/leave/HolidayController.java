package com.hrplatform.leave;

import com.hrplatform.common.ApiResponse;
import com.hrplatform.leave.dto.HolidayRequest;
import com.hrplatform.leave.dto.HolidayResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;

@Tag(name = "Holidays")
@RestController
@RequestMapping("/api/v1/holidays")
@RequiredArgsConstructor
public class HolidayController {

    private final HolidayService holidayService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<HolidayResponse>>> list(@RequestParam(required = false) Integer year) {
        return ResponseEntity.ok(ApiResponse.ok(holidayService.listForYear(year != null ? year : Year.now().getValue())));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<HolidayResponse>> create(@Valid @RequestBody HolidayRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Holiday added.", holidayService.create(request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        holidayService.delete(id);
        return ResponseEntity.ok(ApiResponse.message("Holiday removed."));
    }
}