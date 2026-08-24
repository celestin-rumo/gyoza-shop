package ch.celestin.gyoza.slot;

import ch.celestin.gyoza.order.ContentType;
import ch.celestin.gyoza.order.FulfillmentMethod;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "slot_availability")
public class SlotAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "slot_date", nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(name = "fulfillment_method", nullable = false)
    private FulfillmentMethod fulfillmentMethod;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type", nullable = false)
    private ContentType contentType;

    @Column(nullable = false)
    private boolean open = true;

    protected SlotAvailability() {
    }

    public SlotAvailability(
            LocalDate date,
            FulfillmentMethod fulfillmentMethod,
            LocalTime startTime,
            LocalTime endTime,
            ContentType contentType
    ) {
        this.date = date;
        this.fulfillmentMethod = fulfillmentMethod;
        this.startTime = startTime;
        this.endTime = endTime;
        this.contentType = contentType;
    }

    public Long getId() {
        return id;
    }

    public LocalDate getDate() {
        return date;
    }

    public FulfillmentMethod getFulfillmentMethod() {
        return fulfillmentMethod;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public ContentType getContentType() {
        return contentType;
    }

    public boolean isOpen() {
        return open;
    }

    public void open() {
        this.open = true;
    }

    public void close() {
        this.open = false;
    }

    public void moveTo(LocalDate date) {
        this.date = date;
    }

    public void update(
            LocalDate date,
            FulfillmentMethod fulfillmentMethod,
            LocalTime startTime,
            LocalTime endTime,
            ContentType contentType
    ) {
        this.date = date;
        this.fulfillmentMethod = fulfillmentMethod;
        this.startTime = startTime;
        this.endTime = endTime;
        this.contentType = contentType;
    }
}
