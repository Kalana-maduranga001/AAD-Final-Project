package com.springproject.hospitalitymanagnet.backend.repository;

import com.springproject.hospitalitymanagnet.backend.entity.Amenity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AmenityRepository extends JpaRepository<Amenity, Integer> {
    // You can add custom queries here if needed
}
