package ch.celestin.gyoza.order;

import ch.celestin.gyoza.order.dto.CreateOrderRequest;
import ch.celestin.gyoza.order.dto.OrderResponse;
import ch.celestin.gyoza.user.User;

import java.util.List;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request, User currentUser);

    List<OrderResponse> getAllOrders();

    List<OrderResponse> getOrdersForUser(User currentUser);

    OrderResponse updateStatus(
            Long orderId,
            OrderStatus status
    );
}
