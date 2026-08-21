package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.freshavailability.dto.FreshAvailabilityResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fresh-availability")
public class FreshAvailabilityController {

    private final FreshAvailabilityService freshAvailabilityService;

    public FreshAvailabilityController(FreshAvailabilityService freshAvailabilityService) {
        this.freshAvailabilityService = freshAvailabilityService;
    }

    @GetMapping
    public FreshAvailabilityResponse getCurrent() {
        return freshAvailabilityService.getCurrent();
    }
}
