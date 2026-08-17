package ch.celestin.gyoza.pack;

import ch.celestin.gyoza.product.Product;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "pack_options")
public class PackOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int size;

    @Column(nullable = false)
    private BigDecimal price;

    protected PackOption() {
    }

    public PackOption(
            Product product,
            int size,
            BigDecimal price
    ) {
        this.product = product;
        this.size = size;
        this.price = price;
    }

    public Long getId() {
        return id;
    }

    public Product getProduct() {
        return product;
    }

    public int getSize() {
        return size;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void changePrice(BigDecimal newPrice) {

        if (newPrice == null ||
                newPrice.compareTo(BigDecimal.ZERO) <= 0) {

            throw new IllegalArgumentException(
                    "Price must be greater than 0"
            );
        }

        this.price = newPrice;
    }
}