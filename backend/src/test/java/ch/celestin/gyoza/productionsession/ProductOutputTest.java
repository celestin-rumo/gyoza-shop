package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class ProductOutputTest {

    private final Product product = new Product("Chicken", 100);

    @Test
    void constructor_setsProductAndQuantity() {
        ProductOutput output = new ProductOutput(product, 50);

        assertThat(output.getProduct()).isEqualTo(product);
        assertThat(output.getQuantityProduced()).isEqualTo(50);
    }

    @Test
    void constructor_rejectsNonPositiveQuantity() {
        assertThatIllegalArgumentException().isThrownBy(() -> new ProductOutput(product, 0));
    }
}
