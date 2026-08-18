package ch.celestin.gyoza.order;

import ch.celestin.gyoza.customer.Customer;
import ch.celestin.gyoza.customer.CustomerRepository;
import ch.celestin.gyoza.exception.OrderNotFoundException;
import ch.celestin.gyoza.exception.PackNotFoundException;
import ch.celestin.gyoza.order.dto.*;
import ch.celestin.gyoza.pack.PackOption;
import ch.celestin.gyoza.pack.PackOptionRepository;
import ch.celestin.gyoza.product.Product;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final PackOptionRepository packOptionRepository;

    public OrderServiceImpl(
            OrderRepository orderRepository,
            CustomerRepository customerRepository,
            PackOptionRepository packOptionRepository
    ) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.packOptionRepository = packOptionRepository;
    }

    @Override
    @Transactional
    public OrderResponse createOrder(
            CreateOrderRequest request
    ) {

        Customer customer = new Customer(
                request.customer().firstName(),
                request.customer().lastName(),
                request.customer().email(),
                request.customer().address()
        );

        customerRepository.save(customer);

        Order order = new Order(customer);

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

    private OrderResponse toResponse(Order order) {
        return new OrderResponse(
                order.getId(),
                order.getStatus(),
                order.getTotalPrice(),
                order.getCreatedAt(),
                toCustomerResponse(order.getCustomer()),
                order.getItems().stream().map(this::toItemResponse).toList()
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