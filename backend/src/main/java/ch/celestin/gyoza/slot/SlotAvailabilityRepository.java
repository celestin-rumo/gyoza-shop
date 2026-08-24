package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface SlotAvailabilityRepository extends JpaRepository<SlotAvailability, Long> {

    boolean existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
            LocalDate date, FulfillmentMethod fulfillmentMethod, LocalTime startTime, LocalTime endTime,
            ContentType contentType
    );

    boolean existsByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentTypeAndIdNot(
            LocalDate date, FulfillmentMethod fulfillmentMethod, LocalTime startTime, LocalTime endTime,
            ContentType contentType, Long id
    );

    Optional<SlotAvailability> findByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
            LocalDate date, FulfillmentMethod fulfillmentMethod, LocalTime startTime, LocalTime endTime,
            ContentType contentType
    );

    List<SlotAvailability> findAllByOrderByDateAscStartTimeAsc();

    List<SlotAvailability> findByOpenTrueOrderByDateAscStartTimeAsc();
}
