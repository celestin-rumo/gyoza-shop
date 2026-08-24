package ch.celestin.gyoza.rawmaterial;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Entity
@Table(name = "raw_material_purchases")
public class RawMaterialPurchase {

    private static final int UNIT_PRICE_SCALE = 4;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "raw_material_id", nullable = false)
    private RawMaterial rawMaterial;

    @Column(name = "purchase_date", nullable = false)
    private LocalDate date;

    @Column(nullable = false)
    private BigDecimal quantityPurchased;

    @Column(nullable = false)
    private BigDecimal totalPricePaid;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PurchaseSource source;

    @Column(name = "origin_country", nullable = false)
    private String originCountry;

    @Column(nullable = false)
    private String store;

    @Column(name = "batch_number")
    private String batchNumber;

    protected RawMaterialPurchase() {
    }

    public RawMaterialPurchase(
            RawMaterial rawMaterial,
            LocalDate date,
            BigDecimal quantityPurchased,
            BigDecimal totalPricePaid,
            PurchaseSource source,
            String originCountry,
            String store,
            String batchNumber
    ) {
        if (quantityPurchased == null || quantityPurchased.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "La quantité achetée doit être supérieure à 0"
            );
        }

        if (totalPricePaid == null || totalPricePaid.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException(
                    "Le prix payé doit être supérieur à 0"
            );
        }

        if (originCountry == null || originCountry.isBlank()) {
            throw new IllegalArgumentException(
                    "Le pays de provenance est requis"
            );
        }

        if (store == null || store.isBlank()) {
            throw new IllegalArgumentException(
                    "Le magasin est requis"
            );
        }

        this.rawMaterial = rawMaterial;
        this.date = date;
        this.quantityPurchased = quantityPurchased;
        this.totalPricePaid = totalPricePaid;
        this.source = source;
        this.originCountry = originCountry;
        this.store = store;
        this.batchNumber = batchNumber;
    }

    public Long getId() {
        return id;
    }

    public RawMaterial getRawMaterial() {
        return rawMaterial;
    }

    public LocalDate getDate() {
        return date;
    }

    public BigDecimal getQuantityPurchased() {
        return quantityPurchased;
    }

    public BigDecimal getTotalPricePaid() {
        return totalPricePaid;
    }

    public PurchaseSource getSource() {
        return source;
    }

    public String getOriginCountry() {
        return originCountry;
    }

    public String getStore() {
        return store;
    }

    public String getBatchNumber() {
        return batchNumber;
    }

    public BigDecimal getUnitPrice() {
        return totalPricePaid.divide(quantityPurchased, UNIT_PRICE_SCALE, RoundingMode.HALF_UP);
    }
}
