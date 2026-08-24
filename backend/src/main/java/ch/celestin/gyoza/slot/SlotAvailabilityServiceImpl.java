package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.slot.dto.CreateSlotAvailabilityRequest;
import ch.celestin.gyoza.slot.dto.SlotAvailabilityResponse;
import ch.celestin.gyoza.slot.dto.UpdateSlotAvailabilityRequest;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class SlotAvailabilityServiceImpl implements SlotAvailabilityService {

    private final SlotAvailabilityRepository slotAvailabilityRepository;

    public SlotAvailabilityServiceImpl(SlotAvailabilityRepository slotAvailabilityRepository) {
        this.slotAvailabilityRepository = slotAvailabilityRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlotAvailabilityResponse> getOpenSlots() {
        return slotAvailabilityRepository
                .findByOpenTrueOrderByDateAscStartTimeAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlotAvailabilityResponse> getAllSlots() {
        return slotAvailabilityRepository
                .findAllByOrderByDateAscStartTimeAsc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public SlotAvailabilityResponse createSlot(CreateSlotAvailabilityRequest request) {

        requireStartBeforeEnd(request.startTime(), request.endTime());

        if (slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                request.date(), request.fulfillmentMethod(), request.startTime(), request.endTime(),
                request.contentType()
        )) {
            throw new IllegalArgumentException(
                    "Ce créneau existe déjà pour cette date"
            );
        }

        SlotAvailability slotAvailability = slotAvailabilityRepository.save(
                new SlotAvailability(
                        request.date(), request.fulfillmentMethod(), request.startTime(), request.endTime(),
                        request.contentType()
                )
        );

        return toResponse(slotAvailability);
    }

    @Override
    @Transactional
    public SlotAvailabilityResponse updateSlot(Long slotId, UpdateSlotAvailabilityRequest request) {
        SlotAvailability slotAvailability = findOrThrow(slotId);

        requireStartBeforeEnd(request.startTime(), request.endTime());

        if (slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
                request.date(), request.fulfillmentMethod(), request.startTime(), request.endTime(),
                request.contentType(), slotId
        )) {
            throw new IllegalArgumentException(
                    "Ce créneau existe déjà pour cette date"
            );
        }

        slotAvailability.update(
                request.date(), request.fulfillmentMethod(), request.startTime(), request.endTime(),
                request.contentType()
        );

        return toResponse(slotAvailability);
    }

    @Override
    @Transactional
    public SlotAvailabilityResponse setOpen(Long slotId, boolean open) {
        SlotAvailability slotAvailability = findOrThrow(slotId);

        if (open) {
            slotAvailability.open();
        } else {
            slotAvailability.close();
        }

        return toResponse(slotAvailability);
    }

    @Override
    @Transactional
    public SlotAvailabilityResponse moveDate(Long slotId, LocalDate date) {
        SlotAvailability slotAvailability = findOrThrow(slotId);

        if (slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
                date, slotAvailability.getFulfillmentMethod(),
                slotAvailability.getStartTime(), slotAvailability.getEndTime(),
                slotAvailability.getContentType(), slotId
        )) {
            throw new IllegalArgumentException(
                    "Ce créneau existe déjà pour cette date"
            );
        }

        slotAvailability.moveTo(date);

        return toResponse(slotAvailability);
    }

    @Override
    @Transactional
    public void deleteSlot(Long slotId) {
        SlotAvailability slotAvailability = findOrThrow(slotId);
        slotAvailabilityRepository.delete(slotAvailability);
    }

    private void requireStartBeforeEnd(LocalTime startTime, LocalTime endTime) {
        if (!startTime.isBefore(endTime)) {
            throw new IllegalArgumentException(
                    "L'heure de début doit précéder l'heure de fin"
            );
        }
    }

    private SlotAvailability findOrThrow(Long slotId) {
        return slotAvailabilityRepository
                .findById(slotId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Créneau introuvable : " + slotId
                ));
    }

    private SlotAvailabilityResponse toResponse(SlotAvailability slotAvailability) {
        return new SlotAvailabilityResponse(
                slotAvailability.getId(),
                slotAvailability.getDate(),
                slotAvailability.getFulfillmentMethod(),
                slotAvailability.getStartTime(),
                slotAvailability.getEndTime(),
                slotAvailability.getContentType(),
                slotAvailability.isOpen()
        );
    }
}
