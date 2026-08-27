package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.rawmaterial.RawMaterial;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class RawMaterialUsageTest {

    private final RawMaterial rawMaterial = new RawMaterial("Farine", "kg");
    private final Product product = new Product("Chicken", 100);

    @Test
    void constructor_setsRawMaterialQuantityCostAndTargetProduct() {
        RawMaterialUsage usage = new RawMaterialUsage(rawMaterial, new BigDecimal("2.5"), new BigDecimal("1.2"), product);

        assertThat(usage.getRawMaterial()).isEqualTo(rawMaterial);
        assertThat(usage.getQuantityUsed()).isEqualByComparingTo("2.5");
        assertThat(usage.getUnitCost()).isEqualByComparingTo("1.2");
        assertThat(usage.getTargetProduct()).isEqualTo(product);
    }

    @Test
    void constructor_allowsNullTargetProduct_forSharedIngredients() {
        RawMaterialUsage usage = new RawMaterialUsage(rawMaterial, BigDecimal.ONE, BigDecimal.ZERO, null);

        assertThat(usage.getTargetProduct()).isNull();
    }

    @Test
    void constructor_rejectsNonPositiveQuantity() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new RawMaterialUsage(rawMaterial, BigDecimal.ZERO, BigDecimal.ZERO, null));
    }

    @Test
    void constructor_rejectsNullQuantity() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new RawMaterialUsage(rawMaterial, null, BigDecimal.ZERO, null));
    }

    @Test
    void constructor_rejectsNegativeUnitCost() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new RawMaterialUsage(rawMaterial, BigDecimal.ONE, new BigDecimal("-1"), null));
    }

    @Test
    void constructor_rejectsNullUnitCost() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new RawMaterialUsage(rawMaterial, BigDecimal.ONE, null, null));
    }
}
