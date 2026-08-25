package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import jakarta.persistence.*;

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

    protected ProductOutput() {
    }

    public ProductOutput(Product product, int quantityProduced) {
        if (quantityProduced <= 0) {
            throw new IllegalArgumentException(
                    "La quantité produite doit être supérieure à 0"
            );
        }

        this.product = product;
        this.quantityProduced = quantityProduced;
    }

    public void setProductionSession(ProductionSession productionSession) {
        this.productionSession = productionSession;
    }

    public Product getProduct() {
        return product;
    }

    public int getQuantityProduced() {
        return quantityProduced;
    }
}
