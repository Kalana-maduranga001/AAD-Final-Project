package com.springproject.hospitalitymanagnet.backend.service.impl;

import com.springproject.hospitalitymanagnet.backend.dto.HotelDTO;
import com.springproject.hospitalitymanagnet.backend.entity.Hotel;
import com.springproject.hospitalitymanagnet.backend.repository.HotelRepository;
import com.springproject.hospitalitymanagnet.backend.service.HotelService;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class HotelServiceImpl implements HotelService {

    private final HotelRepository hotelRepository;
    private final ModelMapper modelMapper;

    public HotelServiceImpl(HotelRepository hotelRepository, ModelMapper modelMapper) {
        this.hotelRepository = hotelRepository;
        this.modelMapper = modelMapper;
    }

    @Override
    public HotelDTO saveHotel(HotelDTO hotelDTO) {
        Hotel hotel = modelMapper.map(hotelDTO, Hotel.class);
        Hotel savedHotel = hotelRepository.save(hotel);
        return modelMapper.map(savedHotel, HotelDTO.class);
    }

    @Override
    public HotelDTO updateHotel(Integer id, HotelDTO hotelDTO) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with ID: " + id));

        // map updated fields
        modelMapper.map(hotelDTO, hotel);
        Hotel updated = hotelRepository.save(hotel);
        return modelMapper.map(updated, HotelDTO.class);
    }

    @Override
    public void deleteHotel(Integer id) {
        if (!hotelRepository.existsById(id)) {
            throw new RuntimeException("Hotel not found with ID: " + id);
        }
        hotelRepository.deleteById(id);
    }

    @Override
    public HotelDTO getHotelById(Integer id) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with ID: " + id));
        return modelMapper.map(hotel, HotelDTO.class);
    }

    @Override
    public List<HotelDTO> getAllHotels() {
        return hotelRepository.findAll()
                .stream()
                .map(hotel -> modelMapper.map(hotel, HotelDTO.class))
                .collect(Collectors.toList());
    }
}
