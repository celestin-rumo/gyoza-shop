package ch.celestin.gyoza.order;

import ch.celestin.gyoza.order.dto.CreateOrderRequest;
import ch.celestin.gyoza.order.dto.OrderResponse;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    List<OrderResponse> getAllOrders();

    OrderResponse updateStatus(
            Long orderId,
            OrderStatus status
    );
}