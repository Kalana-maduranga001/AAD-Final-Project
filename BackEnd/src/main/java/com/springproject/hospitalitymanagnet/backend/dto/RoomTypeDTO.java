package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class RoomTypeDTO {
    private Integer id;
    private String name;       // Standard Room, Deluxe Room
    private Double basePrice;
    private Double specialPrice;
    private Integer roomSize;  // Sq Ft
    private String availability; // Available / Pay at Hotel / Corporate

    private List<String> inclusions; // e.g., Free Breakfast, Room Only
    private List<String> amenities;  // e.g., WiFi, Double Bed, Garden View
}
