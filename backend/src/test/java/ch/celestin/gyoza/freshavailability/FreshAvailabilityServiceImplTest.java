package ch.celestin.gyoza.freshavailability;

import ch.celestin.gyoza.freshavailability.dto.FreshAvailabilityResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FreshAvailabilityServiceImplTest {

    @Mock
    private FreshAvailabilityRepository freshAvailabilityRepository;

    private FreshAvailabilityServiceImpl freshAvailabilityService;

    @BeforeEach
    void setUp() {
        freshAvailabilityService = new FreshAvailabilityServiceImpl(freshAvailabilityRepository);
    }

    @Test
    void getCurrent_returnsTheSingletonRowState() {
        FreshAvailability freshAvailability = new FreshAvailability();
        freshAvailability.update(LocalDate.of(2026, 9, 1), true);
        when(freshAvailabilityRepository.findById(FreshAvailability.SINGLETON_ID))
                .thenReturn(Optional.of(freshAvailability));

        FreshAvailabilityResponse response = freshAvailabilityService.getCurrent();

        assertThat(response.nextBatchDate()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(response.orderWindowOpen()).isTrue();
    }

    @Test
    void getCurrent_throwsIllegalStateException_whenSingletonRowIsMissing() {
        when(freshAvailabilityRepository.findById(FreshAvailability.SINGLETON_ID))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> freshAvailabilityService.getCurrent())
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void update_mutatesAndReturnsTheSingletonRow() {
        FreshAvailability freshAvailability = new FreshAvailability();
        freshAvailability.update(null, false);
        when(freshAvailabilityRepository.findById(FreshAvailability.SINGLETON_ID))
                .thenReturn(Optional.of(freshAvailability));

        FreshAvailabilityResponse response =
                freshAvailabilityService.update(LocalDate.of(2026, 9, 15), true);

        assertThat(response.nextBatchDate()).isEqualTo(LocalDate.of(2026, 9, 15));
        assertThat(response.orderWindowOpen()).isTrue();
        assertThat(freshAvailability.getNextBatchDate()).isEqualTo(LocalDate.of(2026, 9, 15));
        assertThat(freshAvailability.isOrderWindowOpen()).isTrue();
    }
}
