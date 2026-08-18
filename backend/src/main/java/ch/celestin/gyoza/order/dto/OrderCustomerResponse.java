package ch.celestin.gyoza.order.dto;

public record OrderCustomerResponse(
        String firstName,
        String lastName,
        String email,
        String address
) {
}
