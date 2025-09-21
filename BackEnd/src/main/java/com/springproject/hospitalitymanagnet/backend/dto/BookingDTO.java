package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.*;
import java.time.LocalDate;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public class BookingDTO {
    private Long id;
    private Long userId;
    private String username;
    private String email;
    private Integer roomTypeId;
    private String roomName;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private int guests;
    private Double totalPrice;
    private String status; // PENDING, CONFIRMED, CANCELLED

    // inside BookingDTO class (add fields)
    private String paymentProviderId;
    private String paymentStatus;
    private Double paymentAmount;
    private String paymentCurrency;
    private String paymentCardLast4;
    private String paymentProvider;

}
