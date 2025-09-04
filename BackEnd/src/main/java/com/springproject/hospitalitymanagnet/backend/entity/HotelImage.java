package com.springproject.hospitalitymanagnet.backend.entity;


import jakarta.persistence.*;
import lombok.*;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "hotel_images")
public class HotelImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String imageUrl; // Could store file path / URL

    @ManyToOne
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;
}
