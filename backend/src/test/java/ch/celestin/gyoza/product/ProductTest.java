package ch.celestin.gyoza.product;

import ch.celestin.gyoza.exception.InsufficientStockException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatIllegalArgumentException;

class ProductTest {

    @Test
    void addStock_increasesQuantity() {
        Product product = new Product("Chicken", 100);

        product.addStock(50);

        assertThat(product.getStockQuantity()).isEqualTo(150);
    }

    @Test
    void addStock_rejectsNonPositiveQuantity() {
        Product product = new Product("Chicken", 100);

        assertThatIllegalArgumentException().isThrownBy(() -> product.addStock(0));
    }

    @Test
    void removeStock_decreasesQuantity() {
        Product product = new Product("Chicken", 100);

        product.removeStock(40);

        assertThat(product.getStockQuantity()).isEqualTo(60);
    }

    @Test
    void removeStock_rejectsNonPositiveQuantity() {
        Product product = new Product("Chicken", 100);

        assertThatIllegalArgumentException().isThrownBy(() -> product.removeStock(-1));
    }

    @Test
    void removeStock_throwsInsufficientStockException_whenNotEnoughStock() {
        Product product = new Product("Chicken", 10);

        assertThatThrownBy(() -> product.removeStock(11))
                .isInstanceOf(InsufficientStockException.class)
                .hasMessageContaining("Chicken");

        // The failed attempt must not have mutated the stock.
        assertThat(product.getStockQuantity()).isEqualTo(10);
    }

    @Test
    void activateAndDeactivate_toggleActiveFlag() {
        Product product = new Product("Chicken", 10);

        product.deactivate();
        assertThat(product.isActive()).isFalse();

        product.activate();
        assertThat(product.isActive()).isTrue();
    }
}
