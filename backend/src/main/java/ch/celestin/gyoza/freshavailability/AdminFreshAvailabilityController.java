package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.freshavailability.dto.FreshAvailabilityResponse;
import ch.celestin.gyoza.freshavailability.dto.UpdateFreshAvailabilityRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/fresh-availability")
public class AdminFreshAvailabilityController {

    private final FreshAvailabilityService freshAvailabilityService;

    public AdminFreshAvailabilityController(FreshAvailabilityService freshAvailabilityService) {
        this.freshAvailabilityService = freshAvailabilityService;
    }

    @PutMapping
    public FreshAvailabilityResponse update(@Valid @RequestBody UpdateFreshAvailabilityRequest request) {
        return freshAvailabilityService.update(request.nextBatchDate(), request.orderWindowOpen());
    }
}
