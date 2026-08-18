package ch.celestin.gyoza.exception;

import java.time.LocalDateTime;

public record ApiError(
        String code,
        String message,
        LocalDateTime timestamp
) {
}