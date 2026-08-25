package ch.celestin.gyoza.order;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.customer.CustomerRepository;
import ch.celestin.gyoza.exception.InsufficientStockException;
import ch.celestin.gyoza.exception.OrderItemsNotValidatedException;
import ch.celestin.gyoza.exception.OrderNotFoundException;
import ch.celestin.gyoza.exception.PackNotFoundException;
import ch.celestin.gyoza.exception.SlotNotAvailableException;
import ch.celestin.gyoza.order.dto.CreateOrderCustomerRequest;
import ch.celestin.gyoza.order.dto.CreateOrderItemRequest;
import ch.celestin.gyoza.order.dto.CreateOrderRequest;
import ch.celestin.gyoza.order.dto.OrderResponse;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.productionsession.ProductOutputAllocationService;
import ch.celestin.gyoza.slot.SlotAvailability;
import ch.celestin.gyoza.slot.SlotAvailabilityRepository;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceImplTest {

    private static final LocalDate DATE = LocalDate.of(2026, 9, 8);
    private static final LocalTime START = LocalTime.of(10, 0);
    private static final LocalTime END = LocalTime.of(12, 0);

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private CustomerRepository customerRepository;

    @Mock
    private PackOptionRepository packOptionRepository;

    @Mock
    private SlotAvailabilityRepository slotAvailabilityRepository;

    @Mock
    private ProductOutputAllocationService productOutputAllocationService;

    private OrderServiceImpl orderService;

    @BeforeEach
    void setUp() {
        orderService = new OrderServiceImpl(
                orderRepository, customerRepository, packOptionRepository, slotAvailabilityRepository,
                productOutputAllocationService
        );
    }

    @Test
    void createOrder_decrementsStock_andReturnsTheCreatedOrder() {
        stubOpenSlot(FulfillmentMethod.PICKUP, ContentType.FROZEN);
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product chicken = new Product("Chicken", 200);
        PackOption sixPack = new PackOption(chicken, 6, new BigDecimal("12.00"));
        when(packOptionRepository.findById(1L)).thenReturn(Optional.of(sixPack));

        CreateOrderRequest request = createOrderRequest(1L, 2);

        OrderResponse response = orderService.createOrder(request, null);

        assertThat(chicken.getStockQuantity()).isEqualTo(188); // 200 - 6 * 2
        assertThat(response.status()).isEqualTo(OrderStatus.RESERVED);
        assertThat(response.totalPrice()).isEqualByComparingTo("24.00"); // 12.00 * 2
        assertThat(response.items()).hasSize(1);
        assertThat(response.date()).isEqualTo(DATE);
        assertThat(response.startTime()).isEqualTo(START);
        assertThat(response.endTime()).isEqualTo(END);

        // Attributes the consumed gyoza back to their production batch(es) — see
        // ProductOutputAllocationService.
        verify(productOutputAllocationService).allocate(eq(chicken), eq(12), any(OrderItem.class));
    }

    @Test
    void createOrder_throwsPackNotFoundException_whenPackDoesNotExist() {
        stubOpenSlot(FulfillmentMethod.PICKUP, ContentType.FROZEN);
        when(packOptionRepository.findById(404L)).thenReturn(Optional.empty());

        CreateOrderRequest request = createOrderRequest(404L, 1);

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(PackNotFoundException.class);
    }

    @Test
    void createOrder_propagatesInsufficientStockException_whenNotEnoughStock() {
        stubOpenSlot(FulfillmentMethod.PICKUP, ContentType.FROZEN);

        Product chicken = new Product("Chicken", 5);
        PackOption sixPack = new PackOption(chicken, 6, new BigDecimal("12.00"));
        when(packOptionRepository.findById(1L)).thenReturn(Optional.of(sixPack));

        CreateOrderRequest request = createOrderRequest(1L, 1); // needs 6, only 5 in stock

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(InsufficientStockException.class);
    }

    @Test
    void updateStatus_appliesAllowedTransition() {
        Order order = new Order(
                new Customer("Jean", "Dupont", "jean@example.com", "1 rue du Test"),
                FulfillmentMethod.PICKUP,
                DATE,
                START,
                END,
                ContentType.FROZEN
        );
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

    @Test
    void updateStatus_toReady_throwsOrderItemsNotValidatedException_whenAnItemIsNotValidated() {
        Order order = orderInPreparingWithOneItem();
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.updateStatus(1L, OrderStatus.READY))
                .isInstanceOf(OrderItemsNotValidatedException.class);
    }

    @Test
    void updateStatus_toReady_succeeds_onceAllItemsAreValidated() {
        Order order = orderInPreparingWithOneItem();
        order.getItems().get(0).setBatchValidated(true);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.updateStatus(1L, OrderStatus.READY);

        assertThat(response.status()).isEqualTo(OrderStatus.READY);
    }

    @Test
    void validateItemBatch_marksTheItemAsValidated() {
        Order order = orderInPreparingWithOneItem();
        Long itemId = 42L;
        setItemId(order.getItems().get(0), itemId);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderResponse response = orderService.validateItemBatch(1L, itemId, true);

        assertThat(response.items().get(0).batchValidated()).isTrue();
    }

    @Test
    void validateItemBatch_throwsEntityNotFoundException_whenItemDoesNotBelongToTheOrder() {
        Order order = orderInPreparingWithOneItem();
        setItemId(order.getItems().get(0), 42L);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.validateItemBatch(1L, 999L, true))
                .isInstanceOf(EntityNotFoundException.class);
    }

    /** Order in PREPARING with a single unvalidated item — the state just before a READY attempt. */
    private Order orderInPreparingWithOneItem() {
        Order order = new Order(
                new Customer("Jean", "Dupont", "jean@example.com", "1 rue du Test"),
                FulfillmentMethod.PICKUP,
                DATE,
                START,
                END,
                ContentType.FROZEN
        );
        order.changeStatus(OrderStatus.PREPARING);

        Product chicken = new Product("Chicken", 200);
        order.addItem(new OrderItem(chicken, 6, 2, new BigDecimal("12.00")));

        return order;
    }

    /** OrderItem.id is JPA-assigned; tests that target a specific item need to fake it via reflection. */
    private void setItemId(OrderItem item, Long id) {
        try {
            var field = OrderItem.class.getDeclaredField("id");
            field.setAccessible(true);
            field.set(item, id);
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void createOrder_withDeliveryAndNoAddress_throwsIllegalArgumentException() {
        CreateOrderRequest request = createOrderRequest(
                1L, 1, FulfillmentMethod.DELIVERY, START, END, ContentType.FROZEN, ""
        );

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(packOptionRepository, slotAvailabilityRepository);
    }

    @Test
    void createOrder_withStartTimeAfterEndTime_throwsIllegalArgumentException() {
        CreateOrderRequest request = createOrderRequest(
                1L, 1, FulfillmentMethod.PICKUP, LocalTime.of(12, 0), LocalTime.of(10, 0), ContentType.FROZEN, ""
        );

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(IllegalArgumentException.class);

        verifyNoInteractions(packOptionRepository, slotAvailabilityRepository);
    }

    @Test
    void createOrder_withUnavailableSlot_throwsSlotNotAvailableException() {
        when(slotAvailabilityRepository.findByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                any(), any(), any(), any(), any()
        )).thenReturn(Optional.empty());

        CreateOrderRequest request = createOrderRequest(1L, 1);

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(SlotNotAvailableException.class);

        verifyNoInteractions(packOptionRepository);
    }

    @Test
    void createOrder_withClosedSlot_throwsSlotNotAvailableException() {
        SlotAvailability closedSlot =
                new SlotAvailability(DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FROZEN);
        closedSlot.close();
        when(slotAvailabilityRepository.findByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                any(), any(), any(), any(), any()
        )).thenReturn(Optional.of(closedSlot));

        CreateOrderRequest request = createOrderRequest(1L, 1);

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(SlotNotAvailableException.class);

        verifyNoInteractions(packOptionRepository);
    }

    /**
     * A slot with FROZEN content exists at this date/time/method, but the request asks for FRESH —
     * content type is now part of the slot's identity, so this is indistinguishable from "no slot at all".
     */
    @Test
    void createOrder_whenNoSlotMatchesTheRequestedContentType_throwsSlotNotAvailableException() {
        when(slotAvailabilityRepository.findByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                DATE, FulfillmentMethod.PICKUP, START, END, ContentType.FRESH
        )).thenReturn(Optional.empty());

        CreateOrderRequest request = createOrderRequest(
                1L, 1, FulfillmentMethod.PICKUP, START, END, ContentType.FRESH, ""
        );

        assertThatThrownBy(() -> orderService.createOrder(request, null))
                .isInstanceOf(SlotNotAvailableException.class);

        verifyNoInteractions(packOptionRepository);
    }

    @Test
    void createOrder_withFreshContentType_whenAvailable_succeeds() {
        stubOpenSlot(FulfillmentMethod.PICKUP, ContentType.FRESH);

        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Product chicken = new Product("Chicken", 200);
        PackOption sixPack = new PackOption(chicken, 6, new BigDecimal("12.00"));
        when(packOptionRepository.findById(1L)).thenReturn(Optional.of(sixPack));

        CreateOrderRequest request = createOrderRequest(
                1L, 2, FulfillmentMethod.PICKUP, START, END, ContentType.FRESH, ""
        );

        OrderResponse response = orderService.createOrder(request, null);

        assertThat(response.contentType()).isEqualTo(ContentType.FRESH);
        assertThat(response.fulfillmentMethod()).isEqualTo(FulfillmentMethod.PICKUP);
    }

    private void stubOpenSlot(FulfillmentMethod fulfillmentMethod, ContentType contentType) {
        SlotAvailability openSlot = new SlotAvailability(DATE, fulfillmentMethod, START, END, contentType);
        when(slotAvailabilityRepository.findByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                DATE, fulfillmentMethod, START, END, contentType
        )).thenReturn(Optional.of(openSlot));
    }

    private CreateOrderRequest createOrderRequest(Long packId, int quantity) {
        return createOrderRequest(
                packId,
                quantity,
                FulfillmentMethod.PICKUP,
                START,
                END,
                ContentType.FROZEN,
                "1 rue du Test"
        );
    }

    private CreateOrderRequest createOrderRequest(
            Long packId,
            int quantity,
            FulfillmentMethod fulfillmentMethod,
            LocalTime startTime,
            LocalTime endTime,
            ContentType contentType,
            String address
    ) {
        return new CreateOrderRequest(
                new CreateOrderCustomerRequest("Jean", "Dupont", "jean@example.com", address),
                List.of(new CreateOrderItemRequest(packId, quantity)),
                fulfillmentMethod,
                DATE,
                startTime,
                endTime,
                contentType
        );
    }
}
