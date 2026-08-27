package ch.celestin.gyoza.rawmaterial;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class RawMaterialPurchaseTest {

    private final RawMaterial rawMaterial = new RawMaterial("Farine", "kg");
    private final LocalDate today = LocalDate.of(2026, 8, 24);

    @Test
    void getUnitPrice_dividesTotalPriceByQuantity() {
        RawMaterialPurchase purchase = new RawMaterialPurchase(
                rawMaterial,
                today,
                new BigDecimal("10"),
                new BigDecimal("25"),
                PurchaseSource.MANUAL,
                "Suisse",
                "Coop",
                null
        );

        assertThat(purchase.getUnitPrice()).isEqualByComparingTo("2.5000");
    }

    @Test
    void constructor_allowsNullBatchNumber() {
        RawMaterialPurchase purchase = new RawMaterialPurchase(
                rawMaterial,
                today,
                BigDecimal.ONE,
                BigDecimal.TEN,
                PurchaseSource.MANUAL,
                "Suisse",
                "Coop",
                null
        );

        assertThat(purchase.getBatchNumber()).isNull();
    }

    @Test
    void constructor_rejectsNonPositiveQuantity() {
        assertThatIllegalArgumentException().isThrownBy(() -> new RawMaterialPurchase(
                rawMaterial,
                today,
                BigDecimal.ZERO,
                BigDecimal.TEN,
                PurchaseSource.MANUAL,
                "Suisse",
                "Coop",
                null
        ));
    }

    @Test
    void constructor_rejectsNonPositiveTotalPrice() {
        assertThatIllegalArgumentException().isThrownBy(() -> new RawMaterialPurchase(
                rawMaterial,
                today,
                BigDecimal.TEN,
                BigDecimal.ZERO,
                PurchaseSource.MANUAL,
                "Suisse",
                "Coop",
                null
        ));
    }

    @Test
    void constructor_rejectsBlankOriginCountry() {
        assertThatIllegalArgumentException().isThrownBy(() -> new RawMaterialPurchase(
                rawMaterial,
                today,
                BigDecimal.TEN,
                BigDecimal.TEN,
                PurchaseSource.MANUAL,
                "  ",
                "Coop",
                null
        ));
    }

    @Test
    void constructor_rejectsBlankStore() {
        assertThatIllegalArgumentException().isThrownBy(() -> new RawMaterialPurchase(
                rawMaterial,
                today,
                BigDecimal.TEN,
                BigDecimal.TEN,
                PurchaseSource.MANUAL,
                "Suisse",
                "",
                null
        ));
    }
}
