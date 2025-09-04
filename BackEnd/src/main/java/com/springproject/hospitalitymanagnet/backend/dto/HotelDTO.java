package com.springproject.hospitalitymanagnet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class HotelDTO {
    private Integer id;
    private String name;
    private String location;
    private Integer starRating;
    private String contactNumber;
    private String description;
    private String status;   // ACTIVE / INACTIVE

    private List<HotelImageDTO> images;
    private List<RoomTypeDTO> roomTypes;
    private List<AmenityDTO> amenities;
    private PolicyDTO policy;
}
