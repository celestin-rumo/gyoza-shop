package ch.celestin.gyoza.productionsession;

import ch.celestin.gyoza.order.OrderItem;
import ch.celestin.gyoza.product.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductOutputAllocationServiceImplTest {

    @Mock
    private ProductOutputRepository productOutputRepository;

    private ProductOutputAllocationServiceImpl service;

    private final Product product = new Product("Chicken", 100);
    private final OrderItem orderItem = new OrderItem(product, 1, 10, new BigDecimal("2"));

    @BeforeEach
    void setUp() {
        service = new ProductOutputAllocationServiceImpl(productOutputRepository);
    }

    @Test
    void allocate_consumesTheOldestBatchFirst() {
        ProductOutput older = new ProductOutput(product, 5, BigDecimal.ONE);
        ProductOutput newer = new ProductOutput(product, 20, BigDecimal.ONE);
        when(productOutputRepository
                .findByProduct_IdAndRemainingQuantityGreaterThanOrderByProductionSession_DateAscIdAsc(any(), eq(0)))
                .thenReturn(List.of(older, newer));

        service.allocate(product, 8, orderItem);

        // 5 from the older (fully depleted) batch, 3 from the newer one.
        assertThat(older.getRemainingQuantity()).isZero();
        assertThat(newer.getRemainingQuantity()).isEqualTo(17);
        assertThat(orderItem.getAllocations()).hasSize(2);
        assertThat(orderItem.getAllocations().get(0).getProductOutput()).isEqualTo(older);
        assertThat(orderItem.getAllocations().get(0).getQuantity()).isEqualTo(5);
        assertThat(orderItem.getAllocations().get(1).getProductOutput()).isEqualTo(newer);
        assertThat(orderItem.getAllocations().get(1).getQuantity()).isEqualTo(3);
    }

    @Test
    void allocate_fallsBackToUnattributed_whenTrackedBatchesRunOut() {
        ProductOutput onlyBatch = new ProductOutput(product, 5, BigDecimal.ONE);
        when(productOutputRepository
                .findByProduct_IdAndRemainingQuantityGreaterThanOrderByProductionSession_DateAscIdAsc(any(), eq(0)))
                .thenReturn(List.of(onlyBatch));

        service.allocate(product, 8, orderItem);

        assertThat(onlyBatch.getRemainingQuantity()).isZero();
        assertThat(orderItem.getAllocations()).hasSize(2);
        assertThat(orderItem.getAllocations().get(0).getProductOutput()).isEqualTo(onlyBatch);
        assertThat(orderItem.getAllocations().get(0).getQuantity()).isEqualTo(5);
        // Unattributed: no batch, the remaining 3 units came from untracked stock.
        assertThat(orderItem.getAllocations().get(1).getProductOutput()).isNull();
        assertThat(orderItem.getAllocations().get(1).getQuantity()).isEqualTo(3);
    }

    @Test
    void allocate_recordsPureUnattributed_whenNoTrackedBatchesExist() {
        when(productOutputRepository
                .findByProduct_IdAndRemainingQuantityGreaterThanOrderByProductionSession_DateAscIdAsc(any(), eq(0)))
                .thenReturn(List.of());

        service.allocate(product, 8, orderItem);

        assertThat(orderItem.getAllocations()).hasSize(1);
        assertThat(orderItem.getAllocations().get(0).getProductOutput()).isNull();
        assertThat(orderItem.getAllocations().get(0).getQuantity()).isEqualTo(8);
    }
}
