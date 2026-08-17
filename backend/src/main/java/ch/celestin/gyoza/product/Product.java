package ch.celestin.gyoza.product;

import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private int stockQuantity;

    @Column(nullable = false)
    private boolean active = true;

    protected Product() {
    }

    public Product(String name, int stockQuantity) {
        this.name = name;
        this.stockQuantity = stockQuantity;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getStockQuantity() {
        return stockQuantity;
    }

    public boolean isActive() {
        return active;
    }

    public void addStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be greater than 0"
            );
        }

        stockQuantity += quantity;
    }

    public void removeStock(int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be greater than 0"
            );
        }

        if (quantity > stockQuantity) {
            throw new IllegalArgumentException(
                    "Insufficient stock"
            );
        }

        stockQuantity -= quantity;
    }
}