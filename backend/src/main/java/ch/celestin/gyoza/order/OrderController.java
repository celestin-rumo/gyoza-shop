package ch.celestin.gyoza.order;

import ch.celestin.gyoza.order.dto.CreateOrderRequest;
import ch.celestin.gyoza.order.dto.OrderResponse;
import ch.celestin.gyoza.security.GyozaUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    public OrderController(
            OrderService orderService
    ) {
        this.orderService = orderService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public OrderResponse createOrder(
            @Valid
            @RequestBody
            CreateOrderRequest request,
            @AuthenticationPrincipal(errorOnInvalidType = false) GyozaUserDetails principal
    ) {
        return orderService.createOrder(request, principal == null ? null : principal.user());
    }

    @GetMapping("/mine")
    public List<OrderResponse> getMyOrders(@AuthenticationPrincipal GyozaUserDetails principal) {
        return orderService.getOrdersForUser(principal.user());
    }
}
