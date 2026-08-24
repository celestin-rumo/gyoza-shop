package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.slot.dto.SlotAvailabilityResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/slots")
public class SlotAvailabilityController {

    private final SlotAvailabilityService slotAvailabilityService;

    public SlotAvailabilityController(SlotAvailabilityService slotAvailabilityService) {
        this.slotAvailabilityService = slotAvailabilityService;
    }

    @GetMapping
    public List<SlotAvailabilityResponse> getOpenSlots() {
        return slotAvailabilityService.getOpenSlots();
    }
}
