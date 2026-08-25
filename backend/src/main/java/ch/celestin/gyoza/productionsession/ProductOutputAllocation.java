package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.order.OrderItem;
import jakarta.persistence.*;

/**
 * Records that {@code quantity} gyoza from an {@link OrderItem} were drawn from a given
 * {@link ProductOutput} batch (FIFO, oldest batch first — see
 * ProductOutputAllocationService). A null {@code productOutput} means the units came from
 * stock that isn't traceable to any production session (a manual admin stock addition, or a
 * product's initial stock) — expected and excluded from session-level "actual revenue".
 */
@Entity
@Table(name = "product_output_allocations")
public class ProductOutputAllocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(optional = true)
    @JoinColumn(name = "product_output_id", nullable = true)
    private ProductOutput productOutput;

    @Column(nullable = false)
    private int quantity;

    protected ProductOutputAllocation() {
    }

    public ProductOutputAllocation(ProductOutput productOutput, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "La quantité allouée doit être supérieure à 0"
            );
        }

        this.productOutput = productOutput;
        this.quantity = quantity;
    }

    public void setOrderItem(OrderItem orderItem) {
        this.orderItem = orderItem;
    }

    public OrderItem getOrderItem() {
        return orderItem;
    }

    public ProductOutput getProductOutput() {
        return productOutput;
    }

    public int getQuantity() {
        return quantity;
    }
}
