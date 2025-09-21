package com.springproject.hospitalitymanagnet.backend.repository;


import com.springproject.hospitalitymanagnet.backend.entity.RoomType;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


import java.util.Optional;

@Repository
public interface RoomTypeRepository extends JpaRepository<RoomType, Integer> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from RoomType r where r.id = :id")
    Optional<RoomType> findByIdForUpdate(@Param("id") Integer id);

    // Find a room type by hotel id and (case-insensitive) name
    Optional<RoomType> findFirstByHotel_IdAndNameIgnoreCase(Integer hotelId, String name);

    // Find a room type by name only (case-insensitive) - useful as fallback
    Optional<RoomType> findFirstByNameIgnoreCase(String name);
}
