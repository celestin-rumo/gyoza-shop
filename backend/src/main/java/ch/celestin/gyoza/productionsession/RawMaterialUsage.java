package ch.celestin.gyoza.productionsession;

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

    protected RawMaterialUsage() {
    }

    public RawMaterialUsage(RawMaterial rawMaterial, BigDecimal quantityUsed) {
        if (quantityUsed == null || quantityUsed.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "La quantité utilisée doit être supérieure à 0"
            );
        }

        this.rawMaterial = rawMaterial;
        this.quantityUsed = quantityUsed;
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
}
