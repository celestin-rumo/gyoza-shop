package ch.celestin.gyoza.order;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.customer.CustomerRepository;
import ch.celestin.gyoza.exception.OrderNotFoundException;
import ch.celestin.gyoza.exception.PackNotFoundException;
import ch.celestin.gyoza.exception.SlotNotAvailableException;
import ch.celestin.gyoza.order.dto.*;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.productionsession.ProductOutputAllocation;
import ch.celestin.gyoza.productionsession.ProductOutputAllocationService;
import ch.celestin.gyoza.slot.SlotAvailability;
import ch.celestin.gyoza.slot.SlotAvailabilityRepository;
import ch.celestin.gyoza.user.User;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PackOptionRepository packOptionRepository;
    private final SlotAvailabilityRepository slotAvailabilityRepository;
    private final ProductOutputAllocationService productOutputAllocationService;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            PackOptionRepository packOptionRepository,
            SlotAvailabilityRepository slotAvailabilityRepository,
            ProductOutputAllocationService productOutputAllocationService
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.packOptionRepository = packOptionRepository;
        this.slotAvailabilityRepository = slotAvailabilityRepository;
        this.productOutputAllocationService = productOutputAllocationService;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(
            CreateOrderRequest request,
            User currentUser
    ) {

        validateFulfillment(request);

        Customer customer = new Customer(
                request.customer().firstName(),
                request.customer().lastName(),
                request.customer().email(),
                request.customer().address()
        );

        customerRepository.save(customer);

        Order order = new Order(
                customer,
                currentUser,
                request.fulfillmentMethod(),
                request.date(),
                request.startTime(),
                request.endTime(),
                request.contentType()
        );

        for (CreateOrderItemRequest line : request.lines()) {

            PackOption pack = packOptionRepository
                    .findById(line.packId())
                    .orElseThrow(
                            () -> new PackNotFoundException(line.packId())
                    );

            Product product = pack.getProduct();

            int requiredGyozas =
                    pack.getSize() * line.quantity();

            product.removeStock(requiredGyozas);

            OrderItem orderItem = new OrderItem(
                    product,
                    pack.getSize(),
                    line.quantity(),
                    pack.getPrice()
            );

            order.addItem(orderItem);

            // Attributes these gyoza back to the production batch(es) they came from
            // (FIFO) so a session's actual revenue can later be computed from real sales —
            // see ProductionSessionCostCalculator.actualSummary.
            productOutputAllocationService.allocate(product, requiredGyozas, orderItem);
        }

        Order savedOrder =
                orderRepository.save(order);

        return toResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        return orderRepository
                .findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersForUser(User currentUser) {
        return orderRepository
                .findByUserIdOrderByCreatedAtDesc(currentUser.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(
            Long orderId,
            OrderStatus status
    ) {

        Order order = orderRepository
                .findById(orderId)
                .orElseThrow(
                        () -> new OrderNotFoundException(orderId)
                );

        order.changeStatus(status);

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse validateItemBatch(
            Long orderId,
            Long itemId,
            boolean validated
    ) {

        Order order = orderRepository
                .findById(orderId)
                .orElseThrow(
                        () -> new OrderNotFoundException(orderId)
                );

        OrderItem item = order.getItems().stream()
                .filter(candidate -> candidate.getId().equals(itemId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException(
                        "Article de commande introuvable : " + itemId
                ));

        item.setBatchValidated(validated);

        return toResponse(order);
    }

    private void validateFulfillment(CreateOrderRequest request) {

        if (request.startTime() == null || request.endTime() == null
                || !request.startTime().isBefore(request.endTime())) {
            throw new IllegalArgumentException("Créneau horaire invalide");
        }

        if (request.fulfillmentMethod() == FulfillmentMethod.DELIVERY
                && (request.customer().address() == null || request.customer().address().isBlank())) {
            throw new IllegalArgumentException(
                    "L'adresse est requise pour une livraison"
            );
        }

        boolean slotOpen = slotAvailabilityRepository
                .findByDateAndFulfillmentMethodAndStartTimeAndEndTimeAndContentType(
                        request.date(), request.fulfillmentMethod(), request.startTime(), request.endTime(),
                        request.contentType()
                )
                .map(SlotAvailability::isOpen)
                .orElse(false);

        if (!slotOpen) {
            throw new SlotNotAvailableException();
        }
    }

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalPrice(),
                order.getCreatedAt(),
                toCustomerResponse(order.getCustomer()),
                order.getItems().stream().map(this::toItemResponse).toList(),
                order.getFulfillmentMethod(),
                order.getDate(),
                order.getStartTime(),
                order.getEndTime(),
                order.getContentType()
        );
    }

    private OrderCustomerResponse toCustomerResponse(Customer customer) {
        return new OrderCustomerResponse(
                customer.getFirstName(),
                customer.getLastName(),
                customer.getEmail(),
                customer.getAddress()
        );
    }

    private OrderItemResponse toItemResponse(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProduct().getName(),
                item.getPackSize(),
                item.getPackQuantity(),
                item.getUnitPackPrice(),
                item.isBatchValidated(),
                item.getAllocations().stream().map(this::toBatchResponse).toList()
        );
    }

    private OrderItemResponse.OrderItemBatchResponse toBatchResponse(ProductOutputAllocation allocation) {
        String batchNumber = allocation.getProductOutput() != null
                ? allocation.getProductOutput().getProductionSession().getBatchNumber()
                : null;

        return new OrderItemResponse.OrderItemBatchResponse(batchNumber, allocation.getQuantity());
    }
}