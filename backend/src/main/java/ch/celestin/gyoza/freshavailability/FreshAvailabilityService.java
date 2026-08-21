package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.freshavailability.dto.FreshAvailabilityResponse;

import java.time.LocalDate;

public interface FreshAvailabilityService {

    FreshAvailabilityResponse getCurrent();

    FreshAvailabilityResponse update(LocalDate nextBatchDate, boolean orderWindowOpen);
}
