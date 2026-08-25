package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.rawmaterial.RawMaterial;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class RawMaterialUsageTest {

    private final RawMaterial rawMaterial = new RawMaterial("Farine", "kg");

    @Test
    void constructor_setsRawMaterialAndQuantity() {
        RawMaterialUsage usage = new RawMaterialUsage(rawMaterial, new BigDecimal("2.5"));

        assertThat(usage.getRawMaterial()).isEqualTo(rawMaterial);
        assertThat(usage.getQuantityUsed()).isEqualByComparingTo("2.5");
    }

    @Test
    void constructor_rejectsNonPositiveQuantity() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new RawMaterialUsage(rawMaterial, BigDecimal.ZERO));
    }

    @Test
    void constructor_rejectsNullQuantity() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new RawMaterialUsage(rawMaterial, null));
    }
}
