package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BookingApiRequestDTO {
    private Long userId;
    private Integer roomTypeId;
    private Integer hotelId;     // NEW - allow client to pass hotel id
    private String roomName;     // NEW - allow client to pass room name
    private String checkIn;   // ISO date string "YYYY-MM-DD"
    private String checkOut;
    private Integer guests;
    private Double totalPrice;

    private Guest guest;
    private Payment payment;

    @Data
    public static class Guest {
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
    }

    @Data
    public static class Payment {
        private String method;   // card
        private String token;    // recommended: gateway token (or demo string)
        private String cardName; // optional
        // DO NOT include raw PAN/CVV in production request
    }
}
