package ch.celestin.gyoza.order;

import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.productionsession.ProductOutputAllocation;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "order_items")
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id")
    private Product product;

    @Column(nullable = false)
    private int packSize;

    @Column(nullable = false)
    private int packQuantity;

    @Column(nullable = false)
    private BigDecimal unitPackPrice;

    // Owning/cascading side: allocation rows must persist together with this item (it has no
    // id yet at order-creation time), via the same Order -> OrderItem cascade chain — see
    // ProductOutputAllocationService.
    @OneToMany(mappedBy = "orderItem", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ProductOutputAllocation> allocations = new ArrayList<>();

    protected OrderItem() {
    }

    public OrderItem(
            Product product,
            int packSize,
            int packQuantity,
            BigDecimal unitPackPrice
    ) {
        this.product = product;
        this.packSize = packSize;
        this.packQuantity = packQuantity;
        this.unitPackPrice = unitPackPrice;
    }

    public void setOrder(Order order) {
        this.order = order;
    }

    public void addAllocation(ProductOutputAllocation allocation) {
        allocations.add(allocation);
        allocation.setOrderItem(this);
    }

    public BigDecimal getTotalPrice() {
        return unitPackPrice.multiply(
                BigDecimal.valueOf(packQuantity)
        );
    }

    public Order getOrder() {
        return order;
    }

    public List<ProductOutputAllocation> getAllocations() {
        return allocations;
    }

    public Product getProduct() {
        return product;
    }

    public int getPackSize() {
        return packSize;
    }

    public int getPackQuantity() {
        return packQuantity;
    }

    public BigDecimal getUnitPackPrice() {
        return unitPackPrice;
    }
}