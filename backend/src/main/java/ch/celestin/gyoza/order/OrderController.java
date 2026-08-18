package ch.celestin.gyoza.order;

import ch.celestin.gyoza.order.dto.CreateOrderRequest;
import ch.celestin.gyoza.order.dto.OrderResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
            CreateOrderRequest request
    ) {
        return orderService.createOrder(request);
    }
}