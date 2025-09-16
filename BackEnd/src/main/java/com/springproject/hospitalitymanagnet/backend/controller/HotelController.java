// ===========================
// 1. UPDATED SPRING BOOT CONTROLLER
// ===========================

package com.springproject.hospitalitymanagnet.backend.controller;

import com.springproject.hospitalitymanagnet.backend.dto.ApiResponse;
import com.springproject.hospitalitymanagnet.backend.dto.HotelDTO;
import com.springproject.hospitalitymanagnet.backend.service.HotelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hotels")
@CrossOrigin(origins = {"http://localhost:5500", "http://127.0.0.1:5500", "http://localhost:63342"})
public class HotelController {

    private final HotelService hotelService;

    public HotelController(HotelService hotelService) {
        this.hotelService = hotelService;
    }

    // === CREATE WITH CLOUDINARY IMAGES (JSON) ===
    @PostMapping("/create")
    public ResponseEntity<ApiResponse> createHotel(@RequestBody HotelDTO hotelDTO) {
        System.out.println(hotelDTO);
        try {
            HotelDTO savedHotel = hotelService.saveHotel(hotelDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Hotel saved successfully", savedHotel));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to save hotel: " + e.getMessage(), null));
        }
    }

    // === CREATE WITH CLOUDINARY IMAGES (Alternative endpoint) ===
    @PostMapping("/withCloudinaryImages")
    public ResponseEntity<ApiResponse> createHotelWithCloudinaryImages(@RequestBody HotelDTO hotelDTO) {
        try {
            // The images are already URLs from Cloudinary, so we just save the hotel data
            HotelDTO savedHotel = hotelService.saveHotel(hotelDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Hotel with Cloudinary images saved successfully", savedHotel));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to save hotel with images: " + e.getMessage(), null));
        }
    }

    // === CREATE WITH MULTIPART FILES (Keep existing for compatibility) ===
    @PostMapping(value = "/withImage", consumes = {"multipart/form-data"})
    public ResponseEntity<ApiResponse> createHotelWithImage(
            @RequestPart("hotel") HotelDTO hotelDTO,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {

        try {
            // Delegate saving to the service layer
            HotelDTO savedHotel = hotelService.saveHotelWithImages(hotelDTO, images);

            return ResponseEntity.ok(
                    new ApiResponse(200, "Hotel + Images saved successfully", savedHotel)
            );

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to save hotel: " + e.getMessage(), null));
        }
    }

    // === UPDATE WITH CLOUDINARY SUPPORT ===
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse> updateHotel(@PathVariable Integer id, @RequestBody HotelDTO hotelDTO) {
        try {
            System.out.println("DEBUG: incoming hotelDTO for update: " + hotelDTO);
            if (hotelDTO.getImages() != null) {
                System.out.println("DEBUG: images payload:");
                hotelDTO.getImages().forEach(img -> System.out.println("  -> id=" + img.getId() + ", url=" + img.getImageUrl()));
            }
            hotelDTO.setId(id);
            HotelDTO updatedHotel = hotelService.updateHotel(id, hotelDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Hotel updated successfully", updatedHotel));
        } catch (Exception e) {
            e.printStackTrace(); // important: print full stacktrace to server logs
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to update hotel: " + e.getClass().getSimpleName() + " - " + e.getMessage(), null));
        }
    }

    // === UPDATE WITH CLOUDINARY IMAGES (Alternative endpoint) ===
    @PutMapping("/updateWithImages/{id}")
    public ResponseEntity<ApiResponse> updateHotelWithCloudinaryImages(@PathVariable Integer id, @RequestBody HotelDTO hotelDTO) {
        try {
            hotelDTO.setId(id);
            HotelDTO updatedHotel = hotelService.updateHotel(id, hotelDTO);
            return ResponseEntity.ok(new ApiResponse(200, "Hotel with images updated successfully", updatedHotel));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to update hotel with images: " + e.getMessage(), null));
        }
    }

    // === DELETE ===
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteHotel(@PathVariable Integer id) {
        try {
            hotelService.deleteHotel(id);
            return ResponseEntity.ok(new ApiResponse(200, "Hotel deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to delete hotel: " + e.getMessage(), null));
        }
    }

    // === GET ONE ===
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse> getHotel(@PathVariable Integer id) {
        try {
            HotelDTO hotel = hotelService.getHotelById(id);
            return ResponseEntity.ok(new ApiResponse(200, "Hotel retrieved successfully", hotel));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to retrieve hotel: " + e.getMessage(), null));
        }
    }

    // === GET ALL ===
    @GetMapping
    public ResponseEntity<ApiResponse> getAllHotels() {
        try {
            List<HotelDTO> hotels = hotelService.getAllHotels();
            return ResponseEntity.ok(new ApiResponse(200, "Hotels retrieved successfully", hotels));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to retrieve hotels: " + e.getMessage(), null));
        }
    }


    // === GET HOTELS BY STATUS ===
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getHotelsByStatus(@PathVariable String status) {
        try {
            List<HotelDTO> hotels = hotelService.getHotelsByStatus(status);
            return ResponseEntity.ok(Map.of(
                    "statusCode", 200,
                    "message", "Hotels retrieved successfully",
                    "data", hotels
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "statusCode", 500,
                    "message", "Server error: " + e.getMessage(),
                    "data", null
            ));
        }
    }


    @GetMapping("/search")
    public ResponseEntity<ApiResponse> searchHotels(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String propertyType) {
        try {
            List<HotelDTO> hotels = hotelService.searchHotels(city, propertyType);
            return ResponseEntity.ok(new ApiResponse(200, "Hotels filtered successfully", hotels));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(new ApiResponse(500, "Failed to search hotels: " + e.getMessage(), null));
        }
    }

}