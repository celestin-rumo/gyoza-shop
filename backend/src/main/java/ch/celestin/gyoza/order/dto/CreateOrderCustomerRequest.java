package ch.celestin.gyoza.order.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateOrderCustomerRequest(

        @NotBlank
        String firstName,

        @NotBlank
        String lastName,

        @Email
        @NotBlank
        String email,

        // Only required when fulfillmentMethod is DELIVERY — validated in
        // OrderServiceImpl, not here (Bean Validation can't see the sibling
        // field on CreateOrderRequest).
        String address
) {
}