package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.slot.dto.CreateSlotAvailabilityRequest;
import ch.celestin.gyoza.slot.dto.MoveSlotRequest;
import ch.celestin.gyoza.slot.dto.SlotAvailabilityResponse;
import ch.celestin.gyoza.slot.dto.UpdateSlotAvailabilityRequest;
import ch.celestin.gyoza.slot.dto.UpdateSlotStatusRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/slots")
public class AdminSlotAvailabilityController {

    private final SlotAvailabilityService slotAvailabilityService;

    public AdminSlotAvailabilityController(SlotAvailabilityService slotAvailabilityService) {
        this.slotAvailabilityService = slotAvailabilityService;
    }

    @GetMapping
    public List<SlotAvailabilityResponse> getAllSlots() {
        return slotAvailabilityService.getAllSlots();
    }

    @PostMapping
    public SlotAvailabilityResponse createSlot(@Valid @RequestBody CreateSlotAvailabilityRequest request) {
        return slotAvailabilityService.createSlot(request);
    }

    @PutMapping("/{slotId}")
    public SlotAvailabilityResponse updateSlot(
            @PathVariable Long slotId,
            @Valid @RequestBody UpdateSlotAvailabilityRequest request
    ) {
        return slotAvailabilityService.updateSlot(slotId, request);
    }

    @PatchMapping("/{slotId}/status")
    public SlotAvailabilityResponse setStatus(
            @PathVariable Long slotId,
            @Valid @RequestBody UpdateSlotStatusRequest request
    ) {
        return slotAvailabilityService.setOpen(slotId, request.open());
    }

    @PatchMapping("/{slotId}/date")
    public SlotAvailabilityResponse moveDate(
            @PathVariable Long slotId,
            @Valid @RequestBody MoveSlotRequest request
    ) {
        return slotAvailabilityService.moveDate(slotId, request.date());
    }

    @DeleteMapping("/{slotId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteSlot(@PathVariable Long slotId) {
        slotAvailabilityService.deleteSlot(slotId);
    }
}
