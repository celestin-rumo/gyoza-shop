package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.slot.dto.CreateSlotAvailabilityRequest;
import ch.celestin.gyoza.slot.dto.SlotAvailabilityResponse;
import ch.celestin.gyoza.slot.dto.UpdateSlotAvailabilityRequest;

import java.time.LocalDate;
import java.util.List;

public interface SlotAvailabilityService {

    List<SlotAvailabilityResponse> getOpenSlots();

    List<SlotAvailabilityResponse> getAllSlots();

    SlotAvailabilityResponse createSlot(CreateSlotAvailabilityRequest request);

    SlotAvailabilityResponse updateSlot(Long slotId, UpdateSlotAvailabilityRequest request);

    SlotAvailabilityResponse setOpen(Long slotId, boolean open);

    SlotAvailabilityResponse moveDate(Long slotId, LocalDate date);

    void deleteSlot(Long slotId);
}
