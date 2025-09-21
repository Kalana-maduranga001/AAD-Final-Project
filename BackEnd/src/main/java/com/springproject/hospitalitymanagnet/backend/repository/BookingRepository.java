package com.springproject.hospitalitymanagnet.backend.repository;

import com.springproject.hospitalitymanagnet.backend.entity.Booking;
import com.springproject.hospitalitymanagnet.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    // Find bookings by user (used by service)
    List<Booking> findByUserId(Long userId);

    // Count active (non-cancelled) bookings for a room type
    long countByRoomTypeIdAndStatusNot(Integer roomTypeId, BookingStatus status);

    // Optional convenience
    boolean existsByRoomTypeIdAndStatusNot(Integer roomTypeId, BookingStatus status);

    // <-- NEW: check for any bookings referencing a room type (regardless of status)
    boolean existsByRoomTypeId(Integer roomTypeId);
}
