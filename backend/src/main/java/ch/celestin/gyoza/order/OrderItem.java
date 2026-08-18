package ch.celestin.gyoza.order;

import ch.celestin.gyoza.product.Product;
import jakarta.persistence.*;

import java.math.BigDecimal;

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

    public BigDecimal getTotalPrice() {
        return unitPackPrice.multiply(
                BigDecimal.valueOf(packQuantity)
        );
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