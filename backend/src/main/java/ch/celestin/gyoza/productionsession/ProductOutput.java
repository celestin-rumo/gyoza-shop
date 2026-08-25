package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "product_outputs")
public class ProductOutput {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "production_session_id", nullable = false)
    private ProductionSession productionSession;

    @ManyToOne(optional = false)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private int quantityProduced;

    // Average sale price per unit (PackOption.price / PackOption.size) for this product at
    // the moment the session was created — frozen so a later pack price change never affects
    // a past session's revenue figures. See ProductionSessionCostCalculator.
    @Column(nullable = false)
    private BigDecimal unitSalePrice;

    // Starts at quantityProduced, decremented by ProductOutputAllocationService as orders
    // consume this batch (oldest batch first) — drives FIFO ordering, not revenue.
    @Column(nullable = false)
    private int remainingQuantity;

    // Read-only side: ownership/cascading lives on OrderItem, since allocation rows are only
    // ever created as part of persisting an order. See ProductOutputAllocation.
    @OneToMany(mappedBy = "productOutput")
    private List<ProductOutputAllocation> allocations = new ArrayList<>();

    protected ProductOutput() {
    }

    public ProductOutput(Product product, int quantityProduced, BigDecimal unitSalePrice) {
        if (quantityProduced <= 0) {
            throw new IllegalArgumentException(
                    "La quantité produite doit être supérieure à 0"
            );
        }

        if (unitSalePrice == null || unitSalePrice.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Le prix de vente unitaire ne peut pas être négatif"
            );
        }

        this.product = product;
        this.quantityProduced = quantityProduced;
        this.unitSalePrice = unitSalePrice;
        this.remainingQuantity = quantityProduced;
    }

    public void setProductionSession(ProductionSession productionSession) {
        this.productionSession = productionSession;
    }

    public void addAllocation(ProductOutputAllocation allocation) {
        allocations.add(allocation);
    }

    /** Consumes up to `quantity` units from this batch — see ProductOutputAllocationService. */
    public void consume(int quantity) {
        if (quantity <= 0 || quantity > remainingQuantity) {
            throw new IllegalArgumentException(
                    "La quantité consommée doit être positive et ne peut pas dépasser le stock restant du lot"
            );
        }

        this.remainingQuantity -= quantity;
    }

    public Long getId() {
        return id;
    }

    public ProductionSession getProductionSession() {
        return productionSession;
    }

    public Product getProduct() {
        return product;
    }

    public int getQuantityProduced() {
        return quantityProduced;
    }

    public BigDecimal getUnitSalePrice() {
        return unitSalePrice;
    }

    public int getRemainingQuantity() {
        return remainingQuantity;
    }

    public List<ProductOutputAllocation> getAllocations() {
        return allocations;
    }
}
