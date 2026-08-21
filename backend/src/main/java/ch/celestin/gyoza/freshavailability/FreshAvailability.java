package ch.celestin.gyoza.freshavailability;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;

@Entity
@Table(name = "fresh_availability")
public class FreshAvailability {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id;

    private LocalDate nextBatchDate;

    @Column(nullable = false)
    private boolean orderWindowOpen;

    // No public multi-arg constructor: this is a singleton row seeded by the
    // V2 migration and only ever mutated via update(), never constructed
    // fresh in application code.
    public FreshAvailability() {
    }

    public Long getId() {
        return id;
    }

    public LocalDate getNextBatchDate() {
        return nextBatchDate;
    }

    public boolean isOrderWindowOpen() {
        return orderWindowOpen;
    }

    public void update(LocalDate nextBatchDate, boolean orderWindowOpen) {
        this.nextBatchDate = nextBatchDate;
        this.orderWindowOpen = orderWindowOpen;
    }
}
