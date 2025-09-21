package com.springproject.hospitalitymanagnet.backend.controller;

import com.springproject.hospitalitymanagnet.backend.dto.BookingApiRequestDTO;
import com.springproject.hospitalitymanagnet.backend.dto.BookingDTO;
import com.springproject.hospitalitymanagnet.backend.entity.RoomType;
import com.springproject.hospitalitymanagnet.backend.service.BookingService;
import com.springproject.hospitalitymanagnet.backend.service.RoomTypeService;
import com.springproject.hospitalitymanagnet.backend.repository.RoomTypeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * BookingController - handles bookings and some room-type convenience endpoints.
 *
 * Notes:
 * - deleteRoomType delegates to RoomTypeService to ensure deletion is safe (no active bookings).
 * - setRoomAvailable / setRoomUnavailable keep using RoomTypeRepository directly for simplicity.
 */
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;
    private final RoomTypeRepository roomTypeRepository;
    private final RoomTypeService roomTypeService;
    private static final Logger logger = LoggerFactory.getLogger(BookingController.class);

    public BookingController(BookingService bookingService,
                             RoomTypeRepository roomTypeRepository,
                             RoomTypeService roomTypeService) {
        this.bookingService = bookingService;
        this.roomTypeRepository = roomTypeRepository;
        this.roomTypeService = roomTypeService;
    }

    // Create Booking
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestParam Long userId,
                                           @RequestParam Integer roomTypeId,
                                           @RequestParam String checkIn,
                                           @RequestParam String checkOut,
                                           @RequestParam int guests) {
        try {
            BookingDTO dto = bookingService.createBooking(
                    userId,
                    roomTypeId,
                    LocalDate.parse(checkIn),
                    LocalDate.parse(checkOut),
                    guests
            );
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException iae) {
            logger.warn("Booking validation failed: {}", iae.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Unexpected error while creating booking", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }

    // Get Booking by ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable Long id) {
        try {
            BookingDTO dto = bookingService.getBookingById(id);
            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error fetching booking by id {}", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    // Get All Bookings
    @GetMapping
    public ResponseEntity<?> getAllBookings() {
        try {
            List<BookingDTO> list = bookingService.getAllBookings();
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            logger.error("Error fetching all bookings", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    // Get Bookings by User
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getBookingsByUser(@PathVariable Long userId) {
        try {
            List<BookingDTO> list = bookingService.getBookingsByUser(userId);
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            logger.error("Error fetching bookings for user {}", userId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    // Cancel Booking
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        try {
            BookingDTO dto = bookingService.cancelBooking(id);

            // RoomType eka update karanna
            if (dto.getRoomTypeId() != null) {
                RoomType room = roomTypeRepository.findById(dto.getRoomTypeId())
                        .orElseThrow(() -> new IllegalArgumentException("Room not found"));
                room.setAvailability("Available");
                roomTypeRepository.save(room);
            }

            return ResponseEntity.ok(dto);
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error cancelling booking {}", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }


    // Delete Booking (keeps same behavior as before)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long id) {
        try {
            bookingService.cancelBooking(id);
            return ResponseEntity.ok(Map.of("message", "Booking " + id + " deleted (cancelled) successfully."));
        } catch (Exception ex) {
            logger.error("Error deleting booking {}", id, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    // Set Room Available (helper endpoint)
    @PutMapping("/room/{roomTypeId}/available")
    public ResponseEntity<?> setRoomAvailable(@PathVariable Integer roomTypeId) {
        try {
            RoomType room = roomTypeRepository.findById(roomTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("Room not found"));
            room.setAvailability("Available");
            roomTypeRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "Room " + roomTypeId + " set to Available."));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error setting room available {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    // Set Room Unavailable (helper endpoint)
    @PutMapping("/room/{roomTypeId}/unavailable")
    public ResponseEntity<?> setRoomUnavailable(@PathVariable Integer roomTypeId) {
        try {
            RoomType room = roomTypeRepository.findById(roomTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("Room not found"));
            room.setAvailability("Unavailable");
            roomTypeRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "Room " + roomTypeId + " set to Unavailable."));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error setting room unavailable {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    // Delete RoomType (delegates to RoomTypeService which will check for active bookings)
    @DeleteMapping("/room/{roomTypeId}")
    public ResponseEntity<?> deleteRoomType(@PathVariable Integer roomTypeId) {
        try {
            roomTypeService.deleteRoomType(roomTypeId);
            return ResponseEntity.ok(Map.of("message", "RoomType " + roomTypeId + " deleted successfully."));
        } catch (IllegalStateException ise) {
            // 409 Conflict indicates client cannot delete because of existing related resources
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ise.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error deleting room type {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @PostMapping("/process")
    public ResponseEntity<?> processBooking(@RequestBody BookingApiRequestDTO req) {
        try {
            // Try to auto-resolve roomTypeId on the controller layer first if missing.
            if (req.getRoomTypeId() == null) {
                if (req.getHotelId() != null && req.getRoomName() != null) {
                    roomTypeRepository.findFirstByHotel_IdAndNameIgnoreCase(req.getHotelId(), req.getRoomName())
                            .ifPresent(rt -> req.setRoomTypeId(rt.getId()));
                }
                // fallback: try to find by name only
                if (req.getRoomTypeId() == null && req.getRoomName() != null) {
                    roomTypeRepository.findFirstByNameIgnoreCase(req.getRoomName())
                            .ifPresent(rt -> req.setRoomTypeId(rt.getId()));
                }
            }

            BookingDTO dto = bookingService.createBookingWithPayment(req); // service will still validate / attempt resolve
            return ResponseEntity.ok(Map.of("booking", dto));
        } catch (IllegalArgumentException iae) {
            logger.warn("Validation/Payment error: {}", iae.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error processing booking", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Internal server error"));
        }
    }





}
