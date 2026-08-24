package ch.celestin.gyoza.exception;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(
            EntityNotFoundException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        new ApiError(
                                "NOT_FOUND",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiError> handleBadRequest(
            IllegalArgumentException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        new ApiError(
                                "INVALID_REQUEST",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> handleBadCredentials(
            BadCredentialsException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(
                        new ApiError(
                                "INVALID_CREDENTIALS",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(PackNotFoundException.class)
    public ResponseEntity<ApiError> handlePackNotFound(
            PackNotFoundException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        new ApiError(
                                "PACK_NOT_FOUND",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ApiError> handleOrderNotFound(
            OrderNotFoundException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(
                        new ApiError(
                                "ORDER_NOT_FOUND",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ApiError> handleInsufficientStock(
            InsufficientStockException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        new ApiError(
                                "INSUFFICIENT_STOCK",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(SlotNotAvailableException.class)
    public ResponseEntity<ApiError> handleSlotNotAvailable(
            SlotNotAvailableException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        new ApiError(
                                "SLOT_NOT_AVAILABLE",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(InvalidOrderStatusException.class)
    public ResponseEntity<ApiError> handleInvalidOrderStatus(
            InvalidOrderStatusException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        new ApiError(
                                "INVALID_ORDER_STATUS",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiError> handleDisabledAccount(
            DisabledException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(
                        new ApiError(
                                "ACCOUNT_NOT_VERIFIED",
                                "Ce compte n'a pas encore été vérifié",
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> handleAccessDenied(
            AccessDeniedException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.FORBIDDEN)
                .body(
                        new ApiError(
                                "ACCESS_DENIED",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(EmailAlreadyRegisteredException.class)
    public ResponseEntity<ApiError> handleEmailAlreadyRegistered(
            EmailAlreadyRegisteredException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(
                        new ApiError(
                                "EMAIL_ALREADY_REGISTERED",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }

    @ExceptionHandler(InvalidOrExpiredTokenException.class)
    public ResponseEntity<ApiError> handleInvalidOrExpiredToken(
            InvalidOrExpiredTokenException ex
    ) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(
                        new ApiError(
                                "INVALID_OR_EXPIRED_TOKEN",
                                ex.getMessage(),
                                LocalDateTime.now()
                        )
                );
    }
}