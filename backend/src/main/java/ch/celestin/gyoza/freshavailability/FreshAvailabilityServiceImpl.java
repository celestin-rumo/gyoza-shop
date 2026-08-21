package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.freshavailability.dto.FreshAvailabilityResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class FreshAvailabilityServiceImpl implements FreshAvailabilityService {

    private final FreshAvailabilityRepository freshAvailabilityRepository;

    public FreshAvailabilityServiceImpl(FreshAvailabilityRepository freshAvailabilityRepository) {
        this.freshAvailabilityRepository = freshAvailabilityRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public FreshAvailabilityResponse getCurrent() {
        return toResponse(findSingletonOrThrow());
    }

    @Override
    @Transactional
    public FreshAvailabilityResponse update(LocalDate nextBatchDate, boolean orderWindowOpen) {
        FreshAvailability freshAvailability = findSingletonOrThrow();
        freshAvailability.update(nextBatchDate, orderWindowOpen);

        return toResponse(freshAvailability);
    }

    private FreshAvailability findSingletonOrThrow() {
        return freshAvailabilityRepository
                .findById(FreshAvailability.SINGLETON_ID)
                .orElseThrow(() -> new IllegalStateException(
                        "La configuration de disponibilité des gyozas frais est manquante"
                ));
    }

    private FreshAvailabilityResponse toResponse(FreshAvailability freshAvailability) {
        return new FreshAvailabilityResponse(
                freshAvailability.getNextBatchDate(),
                freshAvailability.isOrderWindowOpen()
        );
    }
}
