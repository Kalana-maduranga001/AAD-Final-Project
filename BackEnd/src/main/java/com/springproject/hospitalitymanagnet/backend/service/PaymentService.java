package com.springproject.hospitalitymanagnet.backend.service;

import com.springproject.hospitalitymanagnet.backend.dto.PaymentResultDTO;
import com.springproject.hospitalitymanagnet.backend.dto.BookingApiRequestDTO;

public interface PaymentService {
    /**
     * Process payment details from the booking API DTO and return a PaymentResultDTO.
     * Note: parameter type is the nested DTO BookingApiRequestDTO.Payment (not the JPA entity).
     */
    PaymentResultDTO processPayment(BookingApiRequestDTO.Payment paymentInfo, double amount);
}
