package com.springproject.hospitalitymanagnet.backend.service.impl;

import com.springproject.hospitalitymanagnet.backend.entity.BookingStatus;
import com.springproject.hospitalitymanagnet.backend.repository.BookingRepository;
import com.springproject.hospitalitymanagnet.backend.repository.RoomTypeRepository;
import com.springproject.hospitalitymanagnet.backend.service.RoomTypeService;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RoomTypeServiceImpl implements RoomTypeService {

    private final RoomTypeRepository roomTypeRepository;
    private final BookingRepository bookingRepository;

    public RoomTypeServiceImpl(RoomTypeRepository roomTypeRepository,
                               BookingRepository bookingRepository) {
        this.roomTypeRepository = roomTypeRepository;
        this.bookingRepository = bookingRepository;
    }

    /**
     * Safely delete a RoomType row. If there are any bookings
     * referencing the room type (regardless of status), refuse the delete.
     */
    @Override
    @Transactional
    public void deleteRoomType(Integer roomTypeId) {
        boolean hasAnyBooking = bookingRepository.existsByRoomTypeId(roomTypeId);
        if (hasAnyBooking) {
            throw new IllegalStateException("Cannot delete RoomType " + roomTypeId + " — bookings reference it.");
        }
        try {
            roomTypeRepository.deleteById(roomTypeId);
        } catch (DataIntegrityViolationException dive) {
            // Fallback: just in case of a race condition or db-level enforcement
            throw new IllegalStateException("Cannot delete RoomType " + roomTypeId + " — bookings exist.", dive);
        }
    }
}
