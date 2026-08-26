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
    void changeQuantityProduced_updatesQuantityAndRemainingWhenNothingConsumed() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        output.changeQuantityProduced(80);

        assertThat(output.getQuantityProduced()).isEqualTo(80);
        assertThat(output.getRemainingQuantity()).isEqualTo(80);
    }

    @Test
    void changeQuantityProduced_preservesAlreadyConsumedAmount() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));
        output.consume(20);

        output.changeQuantityProduced(90);

        assertThat(output.getQuantityProduced()).isEqualTo(90);
        // 20 already consumed, so remaining is 90 - 20 = 70.
        assertThat(output.getRemainingQuantity()).isEqualTo(70);
    }

    @Test
    void changeQuantityProduced_rejectsValueBelowAlreadyConsumedAmount() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));
        output.consume(20);

        assertThatIllegalArgumentException().isThrownBy(() -> output.changeQuantityProduced(19));
    }

    @Test
    void changeQuantityProduced_rejectsNonPositiveValue() {
        ProductOutput output = new ProductOutput(product, 50, new BigDecimal("2.5"));

        assertThatIllegalArgumentException().isThrownBy(() -> output.changeQuantityProduced(0));
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
