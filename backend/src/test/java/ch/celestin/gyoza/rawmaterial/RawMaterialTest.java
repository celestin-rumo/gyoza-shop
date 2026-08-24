package ch.celestin.gyoza.rawmaterial;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class RawMaterialTest {

    @Test
    void rename_updatesName() {
        RawMaterial rawMaterial = new RawMaterial("Farine", "kg");

        rawMaterial.rename("Farine de blé");

        assertThat(rawMaterial.getName()).isEqualTo("Farine de blé");
    }

    @Test
    void rename_rejectsBlankName() {
        RawMaterial rawMaterial = new RawMaterial("Farine", "kg");

        assertThatIllegalArgumentException().isThrownBy(() -> rawMaterial.rename("   "));
        assertThat(rawMaterial.getName()).isEqualTo("Farine");
    }

    @Test
    void rename_rejectsNullName() {
        RawMaterial rawMaterial = new RawMaterial("Farine", "kg");

        assertThatIllegalArgumentException().isThrownBy(() -> rawMaterial.rename(null));
    }

    @Test
    void changeUnit_updatesUnit() {
        RawMaterial rawMaterial = new RawMaterial("Farine", "kg");

        rawMaterial.changeUnit("g");

        assertThat(rawMaterial.getUnit()).isEqualTo("g");
    }

    @Test
    void changeUnit_rejectsBlankUnit() {
        RawMaterial rawMaterial = new RawMaterial("Farine", "kg");

        assertThatIllegalArgumentException().isThrownBy(() -> rawMaterial.changeUnit(""));
        assertThat(rawMaterial.getUnit()).isEqualTo("kg");
    }
}
