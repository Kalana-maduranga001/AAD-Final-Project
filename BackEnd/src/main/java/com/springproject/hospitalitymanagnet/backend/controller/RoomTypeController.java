package com.springproject.hospitalitymanagnet.backend.controller;

import com.springproject.hospitalitymanagnet.backend.dto.RoomTypeDTO;
import com.springproject.hospitalitymanagnet.backend.entity.RoomType;
import com.springproject.hospitalitymanagnet.backend.repository.RoomTypeRepository;
import com.springproject.hospitalitymanagnet.backend.service.RoomTypeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * RoomTypeController - room-type (inventory) management endpoints.
 *
 * Use this if you want a dedicated place to manage room types.
 */
@RestController
@RequestMapping("/api/roomtypes")
public class RoomTypeController {

    private final RoomTypeService roomTypeService;
    private final RoomTypeRepository roomTypeRepository;
    private static final Logger logger = LoggerFactory.getLogger(RoomTypeController.class);

    public RoomTypeController(RoomTypeService roomTypeService, RoomTypeRepository roomTypeRepository) {
        this.roomTypeService = roomTypeService;
        this.roomTypeRepository = roomTypeRepository;
    }

    @PutMapping("/{roomTypeId}/available")
    public ResponseEntity<?> setAvailable(@PathVariable Integer roomTypeId) {
        try {
            RoomType room = roomTypeRepository.findById(roomTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("Room not found"));
            room.setAvailability("Available");
            roomTypeRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "RoomType " + roomTypeId + " set to Available"));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error setting room available {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @PutMapping("/{roomTypeId}/unavailable")
    public ResponseEntity<?> setUnavailable(@PathVariable Integer roomTypeId) {
        try {
            RoomType room = roomTypeRepository.findById(roomTypeId)
                    .orElseThrow(() -> new IllegalArgumentException("Room not found"));
            room.setAvailability("Unavailable");
            roomTypeRepository.save(room);
            return ResponseEntity.ok(Map.of("message", "RoomType " + roomTypeId + " set to Unavailable"));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error setting room unavailable {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }

    @DeleteMapping("/{roomTypeId}")
    public ResponseEntity<?> deleteRoomType(@PathVariable Integer roomTypeId) {
        try {
            roomTypeService.deleteRoomType(roomTypeId);
            return ResponseEntity.ok(Map.of("message", "RoomType " + roomTypeId + " deleted successfully"));
        } catch (IllegalStateException ise) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", ise.getMessage()));
        } catch (IllegalArgumentException iae) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", iae.getMessage()));
        } catch (Exception ex) {
            logger.error("Error deleting RoomType {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Internal server error"));
        }
    }


    // --- NEW: Get all room types (bulk) ---
    @GetMapping
    public ResponseEntity<?> getAllRoomTypes() {
        try {
            List<RoomType> list = roomTypeRepository.findAll();
            return ResponseEntity.ok(list);
        } catch (Exception ex) {
            logger.error("Error fetching room types", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("status",500,"name","server error","data","server error"));
        }
    }

    @GetMapping("/{roomTypeId}")
    public ResponseEntity<?> getRoomType(@PathVariable Integer roomTypeId) {
        try {
            Optional<RoomType> opt = roomTypeRepository.findById(roomTypeId);
            if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error","RoomType not found"));

            RoomType roomType = opt.get();

            RoomTypeDTO dto = new RoomTypeDTO();
            dto.setId(roomType.getId());
            dto.setName(roomType.getName());
            dto.setBasePrice(roomType.getBasePrice());
            dto.setSpecialPrice(roomType.getSpecialPrice());
            dto.setRoomSize(roomType.getRoomSize());
            dto.setAvailability(roomType.getAvailability());
            dto.setHotelId(roomType.getHotel() != null ? roomType.getHotel().getId() : null);

            return ResponseEntity.ok(dto);
        } catch (Exception ex) {
            logger.error("Error fetching room type {}", roomTypeId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("status",500,"name","server error","data","server error"));
        }
    }

}
