package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.product.Product;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class ProductOutputTest {

    private final Product product = new Product("Chicken", 100);

    @Test
    void constructor_setsProductQuantityAndUnitSalePrice() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        assertThat(output.getProduct()).isEqualTo(product);
        assertThat(output.getQuantityProduced()).isEqualTo(50);
        assertThat(output.getUnitSalePrice()).isEqualByComparingTo("2.5");
    }

    @Test
    void constructor_initializesRemainingQuantityToQuantityProduced() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        assertThat(output.getRemainingQuantity()).isEqualTo(50);
    }

    @Test
    void consume_decrementsRemainingQuantity() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        output.consume(20);

        assertThat(output.getRemainingQuantity()).isEqualTo(30);
    }

    @Test
    void consume_rejectsQuantityAboveWhatRemains() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        assertThatIllegalArgumentException().isThrownBy(() -> output.consume(51));
    }

    @Test
    void consume_rejectsNonPositiveQuantity() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        assertThatIllegalArgumentException().isThrownBy(() -> output.consume(0));
    }

    @Test
    void constructor_rejectsNonPositiveQuantity() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ProductOutput(product, 0, BigDecimal.ZERO));
    }

    @Test
    void constructor_rejectsNegativeUnitSalePrice() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ProductOutput(product, 10, new BigDecimal("-1")));
    }

    @Test
    void constructor_rejectsNullUnitSalePrice() {
        assertThatIllegalArgumentException()
                .isThrownBy(() -> new ProductOutput(product, 10, null));
    }
}
