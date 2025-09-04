package com.springproject.hospitalitymanagnet.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "room_types")
public class RoomType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String name; // Standard Room, Deluxe Room
    private Double basePrice;
    private Double specialPrice;
    private Integer roomSize; // Sq Ft
    private String availability; // Available / Pay at Hotel / Corporate Rate etc.

    @ElementCollection
    @CollectionTable(name = "room_inclusions", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "inclusion")
    private List<String> inclusions;

    @ElementCollection
    @CollectionTable(name = "room_amenities", joinColumns = @JoinColumn(name = "room_id"))
    @Column(name = "amenity")
    private List<String> amenities;

    @ManyToOne
    @JoinColumn(name = "hotel_id")
    private Hotel hotel;
}