package com.springproject.hospitalitymanagnet.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "payment_provider_id", length = 128)
    private String paymentProviderId; // gateway charge id / token

    @Column(length = 64)
    private String provider; // e.g. "stripe", "demo"

    @Column(length = 32)
    private String method; // "card", "paypal" etc.

    @Column(length = 32)
    private String status; // SUCCESS / FAILED / PENDING

    @Column(precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(length = 8)
    private String currency;

    @Column(length = 8)
    private String cardLast4;

    @Column(length = 32)
    private String cardBrand;

    private LocalDateTime createdAt;

    // booking mapped on the Booking side with @OneToOne
}
