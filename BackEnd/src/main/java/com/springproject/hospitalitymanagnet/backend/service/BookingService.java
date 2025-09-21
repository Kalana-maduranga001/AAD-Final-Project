package com.springproject.hospitalitymanagnet.backend.service;

import com.springproject.hospitalitymanagnet.backend.dto.BookingApiRequestDTO;
import com.springproject.hospitalitymanagnet.backend.dto.BookingDTO;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDate;
import java.util.List;

public interface BookingService {
//    @PersistenceContext
//    private EntityManager em;
//    RoomType lockedRoom = em.find(RoomType.class, roomTypeId, LockModeType.PESSIMISTIC_WRITE);

    BookingDTO createBooking(Long userId, Integer roomTypeId, LocalDate checkIn, LocalDate checkOut, int guests);
    BookingDTO getBookingById(Long id);
    List<BookingDTO> getBookingsByUser(Long userId);
    List<BookingDTO> getAllBookings();
    BookingDTO cancelBooking(Long bookingId);
    BookingDTO createBookingWithPayment(BookingApiRequestDTO req);

}