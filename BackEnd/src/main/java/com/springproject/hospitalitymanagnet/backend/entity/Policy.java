package com.springproject.hospitalitymanagnet.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "policies")
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String checkInTime;
    private String checkOutTime;

    @Column(columnDefinition = "TEXT")
    private String cancellationPolicy;

    @Column(columnDefinition = "TEXT")
    private String additionalInfo;

    @OneToOne
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;
}