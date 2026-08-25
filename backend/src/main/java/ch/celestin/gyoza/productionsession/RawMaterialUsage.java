package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "raw_material_usages")
public class RawMaterialUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "production_session_id", nullable = false)
    private ProductionSession productionSession;

    @ManyToOne(optional = false)
    @JoinColumn(name = "raw_material_id", nullable = false)
    private RawMaterial rawMaterial;

    @Column(nullable = false)
    private BigDecimal quantityUsed;

    // The raw material's last-known purchase unit price at the moment the session was
    // created — frozen here so a later purchase price change never affects a past session's
    // cost figures. See ProductionSessionCostCalculator.
    @Column(nullable = false)
    private BigDecimal unitCost;

    // Which flavor this usage line is for; null means it's a shared ingredient whose cost is
    // prorated across every output of the session — see ProductionSessionCostCalculator.
    @ManyToOne(optional = true)
    @JoinColumn(name = "target_product_id", nullable = true)
    private Product targetProduct;

    protected RawMaterialUsage() {
    }

    public RawMaterialUsage(
            RawMaterial rawMaterial,
            BigDecimal quantityUsed,
            BigDecimal unitCost,
            Product targetProduct
    ) {
        if (quantityUsed == null || quantityUsed.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "La quantité utilisée doit être supérieure à 0"
            );
        }

        if (unitCost == null || unitCost.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException(
                    "Le coût unitaire ne peut pas être négatif"
            );
        }

        this.rawMaterial = rawMaterial;
        this.quantityUsed = quantityUsed;
        this.unitCost = unitCost;
        this.targetProduct = targetProduct;
    }

    public void setProductionSession(ProductionSession productionSession) {
        this.productionSession = productionSession;
    }

    public RawMaterial getRawMaterial() {
        return rawMaterial;
    }

    public BigDecimal getQuantityUsed() {
        return quantityUsed;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public Product getTargetProduct() {
        return targetProduct;
    }
}
