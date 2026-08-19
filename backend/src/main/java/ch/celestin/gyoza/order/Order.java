package ch.celestin.gyoza.order;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.exception.InvalidOrderStatusException;
import ch.celestin.gyoza.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_orders")
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // Nullable: guest checkout leaves this unset. Independent of `customer`,
    // which stays a per-order shipping/contact snapshot even when the buyer
    // is logged in — they might ship to a different name/address than their
    // account profile.
    @ManyToOne(optional = true)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    @OneToMany(
            mappedBy = "order",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<OrderItem> items = new ArrayList<>();

    protected Order() {
    }

    public Order(Customer customer, User user) {
        this.customer = customer;
        this.user = user;
        this.status = OrderStatus.RESERVED;
        this.createdAt = LocalDateTime.now();
        this.totalPrice = BigDecimal.ZERO;
    }

    public Order(Customer customer) {
        this(customer, null);
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);

        totalPrice = totalPrice.add(item.getTotalPrice());
    }

    public void changeStatus(OrderStatus newStatus) {

        if (!canTransitionTo(newStatus)) {
            throw new InvalidOrderStatusException(
                    status,
                    newStatus
            );
        }

        this.status = newStatus;
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public User getUser() {
        return user;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public List<OrderItem> getItems() {
        return items;
    }

    private boolean canTransitionTo(
        OrderStatus newStatus
    ) {

        return switch (status) {

            case RESERVED ->
                    newStatus == OrderStatus.PREPARING
                    || newStatus == OrderStatus.CANCELLED;

            case PREPARING ->
                    newStatus == OrderStatus.READY
                    || newStatus == OrderStatus.CANCELLED;

            case READY ->
                    newStatus == OrderStatus.DELIVERED
                    || newStatus == OrderStatus.CANCELLED;

            case DELIVERED, CANCELLED ->
                    false;
        };
    }
}