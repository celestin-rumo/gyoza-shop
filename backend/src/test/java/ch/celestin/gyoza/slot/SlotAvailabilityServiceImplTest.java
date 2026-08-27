package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import ch.celestin.gyoza.slot.dto.CreateSlotAvailabilityRequest;
import ch.celestin.gyoza.slot.dto.SlotAvailabilityResponse;
import ch.celestin.gyoza.slot.dto.UpdateSlotAvailabilityRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlotAvailabilityServiceImplTest {

    private static final LocalDate DATE = LocalDate.of(2027, 1, 5);
    private static final LocalTime START = LocalTime.of(10, 0);
    private static final LocalTime END = LocalTime.of(12, 0);

    @Mock
    private SlotAvailabilityRepository slotAvailabilityRepository;

    private SlotAvailabilityServiceImpl slotAvailabilityService;

    @BeforeEach
    void setUp() {
        slotAvailabilityService = new SlotAvailabilityServiceImpl(slotAvailabilityRepository);
    }

    @Test
    void createSlot_persistsIt_whenValid() {
        when(slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                any(), any(), any(), any(), any()
        )).thenReturn(false);
        when(slotAvailabilityRepository.save(any(SlotAvailability.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        CreateSlotAvailabilityRequest request =
                new CreateSlotAvailabilityRequest(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);

        SlotAvailabilityResponse response = slotAvailabilityService.createSlot(request);

        assertThat(response.date()).isEqualTo(DATE);
        assertThat(response.fulfillmentMethod()).isEqualTo(FulfillmentMethod.PICKUP);
        assertThat(response.startTime()).isEqualTo(START);
        assertThat(response.endTime()).isEqualTo(END);
        assertThat(response.contentType()).isEqualTo(ContentType.FROZEN);
        assertThat(response.open()).isTrue();
    }

    @Test
    void createSlot_rejectsWhenStartTimeIsAfterEndTime() {
        CreateSlotAvailabilityRequest request =
                new CreateSlotAvailabilityRequest(DATE, FulfillmentMethod.PICKUP, END, START, ContentType.FROZEN);

        assertThatThrownBy(() -> slotAvailabilityService.createSlot(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createSlot_rejectsDuplicateDateMethodTimesAndContentType() {
        when(slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                any(), any(), any(), any(), any()
        )).thenReturn(true);

        CreateSlotAvailabilityRequest request =
                new CreateSlotAvailabilityRequest(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);

        assertThatThrownBy(() -> slotAvailabilityService.createSlot(request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateSlot_updatesAllFields() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));
        when(slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(false);

        LocalDate newDate = DATE.plusDays(7);
        LocalTime newStart = LocalTime.of(14, 0);
        LocalTime newEnd = LocalTime.of(16, 0);
        UpdateSlotAvailabilityRequest request =
                new UpdateSlotAvailabilityRequest(newDate, FulfillmentMethod.DELIVERY, newStart, newEnd, ContentType.FRESH);

        SlotAvailabilityResponse response = slotAvailabilityService.updateSlot(1L, request);

        assertThat(response.date()).isEqualTo(newDate);
        assertThat(response.fulfillmentMethod()).isEqualTo(FulfillmentMethod.DELIVERY);
        assertThat(response.startTime()).isEqualTo(newStart);
        assertThat(response.endTime()).isEqualTo(newEnd);
        assertThat(response.contentType()).isEqualTo(ContentType.FRESH);
    }

    @Test
    void updateSlot_rejectsWhenStartTimeIsAfterEndTime() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));

        UpdateSlotAvailabilityRequest request =
                new UpdateSlotAvailabilityRequest(DATE, FulfillmentMethod.PICKUP, END, START, ContentType.FROZEN);

        assertThatThrownBy(() -> slotAvailabilityService.updateSlot(1L, request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateSlot_rejectsDuplicateDateMethodTimesAndContentType() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));
        when(slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(true);

        UpdateSlotAvailabilityRequest request =
                new UpdateSlotAvailabilityRequest(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);

        assertThatThrownBy(() -> slotAvailabilityService.updateSlot(1L, request))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void updateSlot_throwsEntityNotFoundException_whenMissing() {
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.empty());

        UpdateSlotAvailabilityRequest request =
                new UpdateSlotAvailabilityRequest(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);

        assertThatThrownBy(() -> slotAvailabilityService.updateSlot(1L, request))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void setOpen_closesAndReopensSlot() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));

        SlotAvailabilityResponse closed = slotAvailabilityService.setOpen(1L, false);
        assertThat(closed.open()).isFalse();

        SlotAvailabilityResponse reopened = slotAvailabilityService.setOpen(1L, true);
        assertThat(reopened.open()).isTrue();
    }

    @Test
    void setOpen_throwsEntityNotFoundException_whenMissing() {
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> slotAvailabilityService.setOpen(1L, false))
                .isInstanceOf(EntityNotFoundException.class);
    }

    @Test
    void moveDate_updatesTheDate() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));
        when(slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(false);

        LocalDate newDate = DATE.plusDays(7);
        SlotAvailabilityResponse response = slotAvailabilityService.moveDate(1L, newDate);

        assertThat(response.date()).isEqualTo(newDate);
    }

    @Test
    void moveDate_rejectsDuplicateDateMethodTimesAndContentType() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));
        when(slotAvailabilityRepository.existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
                any(), any(), any(), any(), any(), any()
        )).thenReturn(true);

        assertThatThrownBy(() -> slotAvailabilityService.moveDate(1L, DATE.plusDays(7)))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void deleteSlot_removesTheSlot() {
        SlotAvailability slotAvailability =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.of(slotAvailability));

        slotAvailabilityService.deleteSlot(1L);

        verify(slotAvailabilityRepository).delete(slotAvailability);
    }

    @Test
    void deleteSlot_throwsEntityNotFoundException_whenMissing() {
        when(slotAvailabilityRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> slotAvailabilityService.deleteSlot(1L))
                .isInstanceOf(EntityNotFoundException.class);

        verify(slotAvailabilityRepository, never()).delete(any());
    }
}
