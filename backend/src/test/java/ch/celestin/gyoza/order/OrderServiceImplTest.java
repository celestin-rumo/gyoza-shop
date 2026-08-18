package ch.celestin.gyoza.order;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.customer.CustomerRepository;
import ch.celestin.gyoza.exception.InsufficientStockException;
import ch.celestin.gyoza.exception.OrderNotFoundException;
import ch.celestin.gyoza.exception.PackNotFoundException;
import ch.celestin.gyoza.order.dto.CreateOrderCustomerRequest;
import ch.celestin.gyoza.order.dto.CreateOrderItemRequest;
import ch.celestin.gyoza.order.dto.CreateOrderRequest;
import ch.celestin.gyoza.order.dto.OrderResponse;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PackOptionRepository packOptionRepository;

    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderServiceImpl(orderRepository, customerRepository, packOptionRepository);
    }

    @Test
    void createOrder_decrementsStock_andReturnsTheCreatedOrder() {
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product chicken = new Product("Chicken", 200);
        PackOption sixPack = new PackOption(chicken, 6, new BigDecimal("12.00"));
        when(packOptionRepository.findById(1L)).thenReturn(Optional.of(sixPack));

        CreateOrderRequest request = createOrderRequest(1L, 2);

        OrderResponse response = orderService.createOrder(request);

        assertThat(chicken.getStockQuantity()).isEqualTo(188); // 200 - 6 * 2
        assertThat(response.status()).isEqualTo(OrderStatus.RESERVED);
        assertThat(response.totalPrice()).isEqualByComparingTo("24.00"); // 12.00 * 2
        assertThat(response.items()).hasSize(1);
    }

    @Test
    void createOrder_throwsPackNotFoundException_whenPackDoesNotExist() {
        when(packOptionRepository.findById(404L)).thenReturn(Optional.empty());

        CreateOrderRequest request = createOrderRequest(404L, 1);

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(PackNotFoundException.class);
    }

    @Test
    void createOrder_propagatesInsufficientStockException_whenNotEnoughStock() {
        Product chicken = new Product("Chicken", 5);
        PackOption sixPack = new PackOption(chicken, 6, new BigDecimal("12.00"));
        when(packOptionRepository.findById(1L)).thenReturn(Optional.of(sixPack));

        CreateOrderRequest request = createOrderRequest(1L, 1); // needs 6, only 5 in stock

        assertThatThrownBy(() -> orderService.createOrder(request))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    void updateStatus_appliesAllowedTransition() {
        Order order = new Order(new Customer("Jean", "Dupont", "jean@example.com", "1 rue du Test"));
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.updateStatus(1L, OrderStatus.PREPARING);

        assertThat(response.status()).isEqualTo(OrderStatus.PREPARING);
    }

    @Test
    void updateStatus_throwsOrderNotFoundException_whenOrderDoesNotExist() {
        when(orderRepository.findById(anyLong())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> orderService.updateStatus(1L, OrderStatus.PREPARING))
                .isInstanceOf(OrderNotFoundException.class);

        verifyNoInteractions(customerRepository);
    }

    private CreateOrderRequest createOrderRequest(Long packId, int quantity) {
        return new CreateOrderRequest(
                new CreateOrderCustomerRequest("Jean", "Dupont", "jean@example.com", "1 rue du Test"),
                List.of(new CreateOrderItemRequest(packId, quantity))
        );
    }
}
