package com.springproject.hospitalitymanagnet.backend.repository;


import com.springproject.hospitalitymanagnet.backend.entity.Hotel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HotelRepository extends JpaRepository<Hotel, Integer> {

    List<Hotel> findByStatusIgnoreCase(String status);
    List<Hotel> findByStatus(String status);
    List<Hotel> findByCityIgnoreCase(String city);
    List<Hotel> findByPropertyTypeIgnoreCase(String propertyType);
    List<Hotel> findByCityIgnoreCaseAndPropertyTypeIgnoreCase(String city, String propertyType);

}
