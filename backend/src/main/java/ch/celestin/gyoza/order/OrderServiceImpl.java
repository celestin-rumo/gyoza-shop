package ch.celestin.gyoza.order;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.customer.CustomerRepository;
import ch.celestin.gyoza.exception.FreshOrderWindowClosedException;
import ch.celestin.gyoza.exception.OrderNotFoundException;
import ch.celestin.gyoza.exception.PackNotFoundException;
import ch.celestin.gyoza.freshavailability.FreshAvailability;
import ch.celestin.gyoza.freshavailability.FreshAvailabilityRepository;
import ch.celestin.gyoza.order.dto.*;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import ch.celestin.gyoza.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PackOptionRepository packOptionRepository;
    private final FreshAvailabilityRepository freshAvailabilityRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            PackOptionRepository packOptionRepository,
            FreshAvailabilityRepository freshAvailabilityRepository
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.packOptionRepository = packOptionRepository;
        this.freshAvailabilityRepository = freshAvailabilityRepository;
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
                request.slot(),
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

    private void validateFulfillment(CreateOrderRequest request) {

        try {
            if (request.fulfillmentMethod() == FulfillmentMethod.PICKUP) {
                PickupSlot.valueOf(request.slot());
            } else {
                DeliverySlot.valueOf(request.slot());
            }
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Le créneau \"" + request.slot() + "\" n'est pas valide pour " + request.fulfillmentMethod()
            );
        }

        if (request.fulfillmentMethod() == FulfillmentMethod.DELIVERY
                && (request.customer().address() == null || request.customer().address().isBlank())) {
            throw new IllegalArgumentException(
                    "L'adresse est requise pour une livraison"
            );
        }

        if (request.contentType() == ContentType.FRESH) {
            FreshAvailability freshAvailability = freshAvailabilityRepository
                    .findById(FreshAvailability.SINGLETON_ID)
                    .orElse(null);

            if (freshAvailability == null || !freshAvailability.isOrderWindowOpen()) {
                throw new FreshOrderWindowClosedException();
            }
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
                order.getSlot(),
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
                item.getProduct().getName(),
                item.getPackSize(),
                item.getPackQuantity(),
                item.getUnitPackPrice()
        );
    }
}