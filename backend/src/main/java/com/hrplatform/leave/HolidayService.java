package com.hrplatform.leave;

import com.hrplatform.audit.AuditAction;
import com.hrplatform.audit.AuditEntityType;
import com.hrplatform.audit.AuditService;
import com.hrplatform.common.ApiException;
import com.hrplatform.common.ErrorCode;
import com.hrplatform.leave.dto.HolidayRequest;
import com.hrplatform.leave.dto.HolidayResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<HolidayResponse> listForYear(int year) {
        return holidayRepository.findByDateBetweenOrderByDateAsc(
                        LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31))
                .stream()
                .map(h -> HolidayResponse.builder().id(h.getId()).date(h.getDate()).name(h.getName()).build())
                .toList();
    }

    @Transactional
    public HolidayResponse create(HolidayRequest request) {
        if (holidayRepository.existsByDate(request.getDate())) {
            throw ApiException.conflict(ErrorCode.CONFLICT, "A holiday is already recorded for this date.");
        }
        Holiday saved = holidayRepository.save(Holiday.builder().date(request.getDate()).name(request.getName()).build());
        auditService.record(AuditEntityType.HOLIDAY, saved.getId(), AuditAction.CREATE,
                "Added holiday: " + saved.getName() + " (" + saved.getDate() + ")");
        return HolidayResponse.builder().id(saved.getId()).date(saved.getDate()).name(saved.getName()).build();
    }

    @Transactional
    public void delete(String id) {
        Holiday holiday = holidayRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Holiday not found."));
        holidayRepository.deleteById(id);
        auditService.record(AuditEntityType.HOLIDAY, id, AuditAction.DELETE,
                "Removed holiday: " + holiday.getName() + " (" + holiday.getDate() + ")");
    }
}