package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simple DTO returned by PaymentService - includes currency now.
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class PaymentResultDTO {
    private String paymentId;
    private String status;       // e.g. SUCCESS / FAILED
    private String provider;     // e.g. demo/stripe
    private String method;       // card/paypal
    private String cardLast4;
    private String cardBrand;
    private String message;
    private String currency;     // <-- ADDED: e.g. "USD"
}
