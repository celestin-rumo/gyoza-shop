package ch.celestin.gyoza.order;

import ch.celestin.gyoza.order.dto.OrderResponse;
import ch.celestin.gyoza.order.dto.UpdateOrderStatusRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private final OrderService orderService;

    public AdminOrderController(
            OrderService orderService
    ) {
        this.orderService = orderService;
    }

    @GetMapping
    public List<OrderResponse> getOrders() {
        return orderService.getAllOrders();
    }

    @PatchMapping("/{id}/status")
    public OrderResponse updateStatus(
            @PathVariable Long id,
            @Valid
            @RequestBody UpdateOrderStatusRequest request
    ) {
        return orderService.updateStatus(
                id,
                request.status()
        );
    }
}