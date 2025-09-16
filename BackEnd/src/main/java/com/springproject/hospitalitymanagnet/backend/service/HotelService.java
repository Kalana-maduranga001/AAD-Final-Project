package com.springproject.hospitalitymanagnet.backend.service;

import com.springproject.hospitalitymanagnet.backend.dto.HotelDTO;
import org.springframework.stereotype.Repository;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Repository
public interface HotelService {
    HotelDTO saveHotel(HotelDTO hotel);
    HotelDTO updateHotel(Integer id , HotelDTO hotel);
    void deleteHotel(Integer id);
    HotelDTO getHotelById(Integer id);
    List<HotelDTO> getAllHotels();
    HotelDTO saveHotelWithImages(HotelDTO hotelDTO, List<MultipartFile> images);
    List<HotelDTO> searchHotels(String city, String propertyType);

    List<HotelDTO> getHotelsByStatus(String status);

}
