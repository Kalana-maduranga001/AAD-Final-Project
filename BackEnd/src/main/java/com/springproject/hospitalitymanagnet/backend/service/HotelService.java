package com.springproject.hospitalitymanagnet.backend.service;

import com.springproject.hospitalitymanagnet.backend.dto.HotelDTO;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface HotelService {
    HotelDTO saveHotel(HotelDTO hotel);
    HotelDTO updateHotel(Integer id , HotelDTO hotel);
    void deleteHotel(Integer id);
    HotelDTO getHotelById(Integer id);
    List<HotelDTO> getAllHotels();
}
