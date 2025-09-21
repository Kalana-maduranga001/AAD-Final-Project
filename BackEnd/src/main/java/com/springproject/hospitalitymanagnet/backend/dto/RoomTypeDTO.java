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
    private String name;
    private Double basePrice;
    private Double specialPrice;
    private Integer roomSize;
    private String availability;
    private Integer hotelId;
    private List<String> inclusions;
    private List<String> amenities;
}
