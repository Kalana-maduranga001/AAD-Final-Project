package com.springproject.hospitalitymanagnet.backend.service.impl;

import com.springproject.hospitalitymanagnet.backend.dto.*;
import com.springproject.hospitalitymanagnet.backend.entity.*;
import com.springproject.hospitalitymanagnet.backend.repository.AmenityRepository;
import com.springproject.hospitalitymanagnet.backend.repository.BookingRepository;
import com.springproject.hospitalitymanagnet.backend.repository.HotelRepository;
import com.springproject.hospitalitymanagnet.backend.repository.RoomTypeRepository;
import com.springproject.hospitalitymanagnet.backend.service.HotelService;
import org.modelmapper.ModelMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HotelServiceImpl implements HotelService {

    private final HotelRepository hotelRepository;
    private final AmenityRepository amenityRepository;
    private final ModelMapper modelMapper;
    private final BookingRepository bookingRepository;
    private final RoomTypeRepository roomTypeRepository;

    public HotelServiceImpl(HotelRepository hotelRepository,
                            AmenityRepository amenityRepository,
                            ModelMapper modelMapper,
                            BookingRepository bookingRepository,
                            RoomTypeRepository roomTypeRepository) {
        this.hotelRepository = hotelRepository;
        this.amenityRepository = amenityRepository;
        this.modelMapper = modelMapper;
        this.bookingRepository = bookingRepository;
        this.roomTypeRepository = roomTypeRepository;
    }

    @Override
    public HotelDTO saveHotel(HotelDTO hotelDTO) {
        Hotel hotel = modelMapper.map(hotelDTO, Hotel.class);

        // Fix for Policy detached entity
        if (hotel.getPolicy() != null) {
            hotel.getPolicy().setHotel(hotel);
        }

        // Handle Amenities (existing or new)
        if (hotel.getAmenities() != null) {
            List<Amenity> processedAmenities = new ArrayList<>();
            for (Amenity amenity : hotel.getAmenities()) {
                if (amenity.getId() != null) {
                    Amenity existing = amenityRepository.findById(amenity.getId())
                            .orElseThrow(() -> new RuntimeException("Amenity not found with ID: " + amenity.getId()));
                    processedAmenities.add(existing);
                } else {
                    processedAmenities.add(amenityRepository.save(amenity));
                }
            }
            hotel.setAmenities(processedAmenities);
        }

        // Handle Images
        if (hotel.getImages() != null) {
            for (HotelImage image : hotel.getImages()) {
                image.setHotel(hotel);
            }
        }

        // ✅ Handle RoomTypes
        if (hotel.getRoomTypes() != null) {
            for (RoomType rt : hotel.getRoomTypes()) {
                rt.setHotel(hotel);
            }
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        return modelMapper.map(savedHotel, HotelDTO.class);
    }

    @Override
    public HotelDTO updateHotel(Integer id, HotelDTO hotelDTO) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with ID: " + id));

        // Update basic fields
        hotel.setName(hotelDTO.getName());
        hotel.setLocation(hotelDTO.getLocation());
        hotel.setStarRating(hotelDTO.getStarRating());
        hotel.setContactNumber(hotelDTO.getContactNumber());
        hotel.setDescription(hotelDTO.getDescription());
        hotel.setStatus(hotelDTO.getStatus());

        hotel.setPropertyType(hotelDTO.getPropertyType());
        hotel.setCity(hotelDTO.getCity());
        hotel.setStartingPrice(hotelDTO.getStartingPrice());
        hotel.setAverageRating(hotelDTO.getAverageRating());

        // Update Policy
        if (hotelDTO.getPolicy() != null) {
            if (hotel.getPolicy() == null) {
                hotel.setPolicy(new Policy());
            }
            hotel.getPolicy().setCheckInTime(hotelDTO.getPolicy().getCheckInTime());
            hotel.getPolicy().setCheckOutTime(hotelDTO.getPolicy().getCheckOutTime());
            hotel.getPolicy().setCancellationPolicy(hotelDTO.getPolicy().getCancellationPolicy());
            hotel.getPolicy().setAdditionalInfo(hotelDTO.getPolicy().getAdditionalInfo());
            hotel.getPolicy().setHotel(hotel);
        }

        // Update Amenities
        if (hotelDTO.getAmenities() != null) {
            List<Amenity> newAmenities = hotelDTO.getAmenities().stream().map(a -> {
                if (a.getId() != null) {
                    return amenityRepository.findById(a.getId())
                            .orElseThrow(() -> new RuntimeException("Amenity not found with ID: " + a.getId()));
                }
                return amenityRepository.save(new Amenity(null, a.getName()));
            }).collect(Collectors.toList());
            hotel.setAmenities(newAmenities);
        }

        // =========================
        // ✅ Safe Update RoomTypes
        // =========================
        if (hotelDTO.getRoomTypes() != null) {

            // Capture existing room types and incoming room type IDs
            List<RoomType> existingRoomTypes = new ArrayList<>(Optional.ofNullable(hotel.getRoomTypes()).orElse(Collections.emptyList()));
            Set<Integer> incomingIds = hotelDTO.getRoomTypes().stream()
                    .map(RoomTypeDTO::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            // Determine which existing RoomTypes would be removed
            List<RoomType> toRemove = existingRoomTypes.stream()
                    .filter(rt -> rt.getId() != null && !incomingIds.contains(rt.getId()))
                    .collect(Collectors.toList());

            // Check bookings for each to-be-removed RoomType
            for (RoomType rt : toRemove) {
                Integer rtId = rt.getId();
                boolean hasAnyBooking = bookingRepository.existsByRoomTypeId(rtId);
                if (hasAnyBooking) {
                    // refuse the update to avoid FK constraint error and preserve booking history
                    throw new IllegalStateException("Cannot remove RoomType " + rtId +
                            " because bookings reference it. Cancel or reassign bookings first.");
                }
            }

            // At this point it's safe to remove those room types from the hotel collection
            // (JPA will delete if orphanRemoval is enabled; otherwise you may wish to explicitly delete)
            hotel.getRoomTypes().removeIf(rt -> rt.getId() != null && !incomingIds.contains(rt.getId()));

            // Reconcile incoming DTOs: reuse existing RoomType entities when id is present
            for (RoomTypeDTO rtDTO : hotelDTO.getRoomTypes()) {
                RoomType rtEntity;
                if (rtDTO.getId() != null) {
                    // try to reuse existing entity from DB (safer)
                    rtEntity = roomTypeRepository.findById(rtDTO.getId())
                            .orElseGet(RoomType::new); // fallback new if not found (shouldn't usually happen)
                } else {
                    rtEntity = new RoomType();
                }

                // update fields
                rtEntity.setId(rtDTO.getId());
                rtEntity.setName(rtDTO.getName());
                rtEntity.setBasePrice(rtDTO.getBasePrice());
                rtEntity.setSpecialPrice(rtDTO.getSpecialPrice());
                rtEntity.setRoomSize(rtDTO.getRoomSize());
                rtEntity.setAvailability(rtDTO.getAvailability());
                rtEntity.setInclusions(rtDTO.getInclusions());
                rtEntity.setAmenities(rtDTO.getAmenities());
                rtEntity.setHotel(hotel);

                // ensure the collection contains this instance (avoid duplicates)
                if (hotel.getRoomTypes() == null) {
                    hotel.setRoomTypes(new ArrayList<>());
                }
                boolean alreadyPresent = hotel.getRoomTypes().stream()
                        .anyMatch(existing -> Objects.equals(existing.getId(), rtEntity.getId()));
                if (!alreadyPresent) {
                    hotel.getRoomTypes().add(rtEntity);
                } else {
                    // update the existing item's fields in-place
                    hotel.getRoomTypes().stream()
                            .filter(existing -> Objects.equals(existing.getId(), rtEntity.getId()))
                            .findFirst()
                            .ifPresent(existing -> {
                                existing.setName(rtEntity.getName());
                                existing.setBasePrice(rtEntity.getBasePrice());
                                existing.setSpecialPrice(rtEntity.getSpecialPrice());
                                existing.setRoomSize(rtEntity.getRoomSize());
                                existing.setAvailability(rtEntity.getAvailability());
                                existing.setInclusions(rtEntity.getInclusions());
                                existing.setAmenities(rtEntity.getAmenities());
                                existing.setHotel(hotel);
                            });
                }
            }
        }

        Hotel updatedHotel;
        try {
            updatedHotel = hotelRepository.save(hotel);
        } catch (DataIntegrityViolationException ex) {
            // Defensive: convert DB FK violation into a nicer message
            throw new IllegalStateException("Failed to update hotel: a referenced entity prevented modification.", ex);
        }

        return modelMapper.map(updatedHotel, HotelDTO.class);
    }

    @Override
    public void deleteHotel(Integer id) {
        if (!hotelRepository.existsById(id)) {
            throw new RuntimeException("Hotel not found with ID: " + id);
        }
        hotelRepository.deleteById(id);
    }

    @Override
    @Transactional
    public HotelDTO getHotelById(Integer id) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with ID: " + id));

        HotelDTO dto = new HotelDTO();
        dto.setId(hotel.getId());
        dto.setName(hotel.getName());
        dto.setLocation(hotel.getLocation());
        dto.setStarRating(hotel.getStarRating());
        dto.setContactNumber(hotel.getContactNumber());
        dto.setDescription(hotel.getDescription());
        dto.setStatus(hotel.getStatus());
        dto.setPropertyType(hotel.getPropertyType());
        dto.setCity(hotel.getCity());
        dto.setStartingPrice(hotel.getStartingPrice());
        dto.setAverageRating(hotel.getAverageRating());


        // ✅ Map room types manually
        if (hotel.getRoomTypes() != null) {
            dto.setRoomTypes(hotel.getRoomTypes().stream().map(rt -> {
                RoomTypeDTO rtd = new RoomTypeDTO();
                rtd.setId(rt.getId());
                rtd.setName(rt.getName());
                rtd.setBasePrice(rt.getBasePrice());
                rtd.setSpecialPrice(rt.getSpecialPrice());
                rtd.setRoomSize(rt.getRoomSize());
                rtd.setAvailability(rt.getAvailability());
                rtd.setInclusions(rt.getInclusions());
                rtd.setAmenities(rt.getAmenities());
                return rtd;
            }).toList());
        }

        // ✅ Map amenities manually (if needed)
        if (hotel.getAmenities() != null) {
            dto.setAmenities(hotel.getAmenities().stream()
                    .map(a -> new AmenityDTO(a.getId(), a.getName()))
                    .toList());
        }

        // ✅ Map policy if exists
        if (hotel.getPolicy() != null) {
            PolicyDTO p = new PolicyDTO();
            p.setId(hotel.getPolicy().getId());
            p.setCheckInTime(hotel.getPolicy().getCheckInTime());
            p.setCheckOutTime(hotel.getPolicy().getCheckOutTime());
            p.setCancellationPolicy(hotel.getPolicy().getCancellationPolicy());
            p.setAdditionalInfo(hotel.getPolicy().getAdditionalInfo());
            dto.setPolicy(p);
        }

        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotelDTO> getAllHotels() {
        return hotelRepository.findAll().stream().map(hotel -> {
            HotelDTO dto = new HotelDTO();
            dto.setId(hotel.getId());
            dto.setName(hotel.getName());
            dto.setLocation(hotel.getLocation());
            dto.setStarRating(hotel.getStarRating());
            dto.setContactNumber(hotel.getContactNumber());
            dto.setDescription(hotel.getDescription());
            dto.setStatus(hotel.getStatus());

            // new fields
            dto.setPropertyType(hotel.getPropertyType());
            dto.setCity(hotel.getCity());
            dto.setStartingPrice(hotel.getStartingPrice());
            dto.setAverageRating(hotel.getAverageRating());

            // images
            if (hotel.getImages() != null) {
                dto.setImages(hotel.getImages().stream()
                        .map(img -> new com.springproject.hospitalitymanagnet.backend.dto.HotelImageDTO(img.getId(), img.getImageUrl()))
                        .collect(Collectors.toList()));
            } else {
                dto.setImages(Collections.emptyList());
            }

            // room types
            if (hotel.getRoomTypes() != null) {
                dto.setRoomTypes(hotel.getRoomTypes().stream().map(rt -> {
                    RoomTypeDTO rtd = new RoomTypeDTO();
                    rtd.setId(rt.getId());
                    rtd.setName(rt.getName());
                    rtd.setBasePrice(rt.getBasePrice());
                    rtd.setSpecialPrice(rt.getSpecialPrice());
                    rtd.setRoomSize(rt.getRoomSize());
                    rtd.setAvailability(rt.getAvailability());
                    rtd.setInclusions(rt.getInclusions());
                    rtd.setAmenities(rt.getAmenities());
                    return rtd;
                }).collect(Collectors.toList()));
            } else {
                dto.setRoomTypes(Collections.emptyList());
            }

            // amenities
            if (hotel.getAmenities() != null) {
                dto.setAmenities(hotel.getAmenities().stream()
                        .map(a -> new AmenityDTO(a.getId(), a.getName()))
                        .collect(Collectors.toList()));
            } else {
                dto.setAmenities(Collections.emptyList());
            }

            // policy
            if (hotel.getPolicy() != null) {
                PolicyDTO p = new PolicyDTO();
                p.setId(hotel.getPolicy().getId());
                p.setCheckInTime(hotel.getPolicy().getCheckInTime());
                p.setCheckOutTime(hotel.getPolicy().getCheckOutTime());
                p.setCancellationPolicy(hotel.getPolicy().getCancellationPolicy());
                p.setAdditionalInfo(hotel.getPolicy().getAdditionalInfo());
                dto.setPolicy(p);
            }

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    public HotelDTO saveHotelWithImages(HotelDTO hotelDTO, List<MultipartFile> images) {
        Hotel hotel = modelMapper.map(hotelDTO, Hotel.class);

        // Fix for Policy detached entity
        if (hotel.getPolicy() != null) {
            hotel.getPolicy().setHotel(hotel);
        }

        // Handle Amenities
        if (hotel.getAmenities() != null) {
            List<Amenity> processedAmenities = new ArrayList<>();
            for (Amenity amenity : hotel.getAmenities()) {
                if (amenity.getId() != null) {
                    Amenity existing = amenityRepository.findById(amenity.getId())
                            .orElseThrow(() -> new RuntimeException("Amenity not found with ID: " + amenity.getId()));
                    processedAmenities.add(existing);
                } else {
                    processedAmenities.add(amenityRepository.save(amenity));
                }
            }
            hotel.setAmenities(processedAmenities);
        }

        // Handle image files
        if (images != null) {
            List<HotelImage> imageEntities = images.stream().map(file -> {
                try {
                    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
                    Path path = Paths.get("uploads/hotels/" + fileName);
                    Files.createDirectories(path.getParent());
                    Files.write(path, file.getBytes());

                    HotelImage imgEntity = new HotelImage();
                    imgEntity.setImageUrl("/uploads/hotels/" + fileName);
                    imgEntity.setHotel(hotel);
                    return imgEntity;

                } catch (Exception e) {
                    throw new RuntimeException("Failed to save image: " + file.getOriginalFilename(), e);
                }
            }).toList();

            hotel.setImages(imageEntities);
        }

        Hotel savedHotel = hotelRepository.save(hotel);
        return modelMapper.map(savedHotel, HotelDTO.class);
    }

    @Override
    @Transactional(readOnly = true)
    public List<HotelDTO> searchHotels(String city, String propertyType) {
        List<Hotel> hotels;

        boolean hasCity = city != null && !city.isBlank();
        boolean hasType = propertyType != null && !propertyType.isBlank();

        if (hasCity && hasType) {
            hotels = hotelRepository.findByCityIgnoreCaseAndPropertyTypeIgnoreCase(city.trim(), propertyType.trim());
        } else if (hasCity) {
            hotels = hotelRepository.findByCityIgnoreCase(city.trim());
        } else if (hasType) {
            hotels = hotelRepository.findByPropertyTypeIgnoreCase(propertyType.trim());
        } else {
            hotels = hotelRepository.findAll();
        }

        // map same as getAllHotels (ensure nested lists populated)
        return hotels.stream().map(hotel -> {
            HotelDTO dto = new HotelDTO();
            dto.setId(hotel.getId());
            dto.setName(hotel.getName());
            dto.setLocation(hotel.getLocation());
            dto.setStarRating(hotel.getStarRating());
            dto.setContactNumber(hotel.getContactNumber());
            dto.setDescription(hotel.getDescription());
            dto.setStatus(hotel.getStatus());

            dto.setPropertyType(hotel.getPropertyType());
            dto.setCity(hotel.getCity());
            dto.setStartingPrice(hotel.getStartingPrice());
            dto.setAverageRating(hotel.getAverageRating());

            if (hotel.getImages() != null) {
                dto.setImages(hotel.getImages().stream()
                        .map(img -> new com.springproject.hospitalitymanagnet.backend.dto.HotelImageDTO(img.getId(), img.getImageUrl()))
                        .collect(Collectors.toList()));
            } else {
                dto.setImages(Collections.emptyList());
            }

            if (hotel.getRoomTypes() != null) {
                dto.setRoomTypes(hotel.getRoomTypes().stream().map(rt -> {
                    RoomTypeDTO rtd = new RoomTypeDTO();
                    rtd.setId(rt.getId());
                    rtd.setName(rt.getName());
                    rtd.setBasePrice(rt.getBasePrice());
                    rtd.setSpecialPrice(rt.getSpecialPrice());
                    rtd.setRoomSize(rt.getRoomSize());
                    rtd.setAvailability(rt.getAvailability());
                    rtd.setInclusions(rt.getInclusions());
                    rtd.setAmenities(rt.getAmenities());
                    return rtd;
                }).collect(Collectors.toList()));
            } else {
                dto.setRoomTypes(Collections.emptyList());
            }

            if (hotel.getAmenities() != null) {
                dto.setAmenities(hotel.getAmenities().stream()
                        .map(a -> new AmenityDTO(a.getId(), a.getName()))
                        .collect(Collectors.toList()));
            } else {
                dto.setAmenities(Collections.emptyList());
            }

            if (hotel.getPolicy() != null) {
                PolicyDTO p = new PolicyDTO();
                p.setId(hotel.getPolicy().getId());
                p.setCheckInTime(hotel.getPolicy().getCheckInTime());
                p.setCheckOutTime(hotel.getPolicy().getCheckOutTime());
                p.setCancellationPolicy(hotel.getPolicy().getCancellationPolicy());
                p.setAdditionalInfo(hotel.getPolicy().getAdditionalInfo());
                dto.setPolicy(p);
            }

            return dto;
        }).collect(Collectors.toList());
    }



    @Override
    @Transactional(readOnly = true)
    public List<HotelDTO> getHotelsByStatus(String status) {
        List<Hotel> hotels = hotelRepository.findByStatusIgnoreCase(status);

        System.out.println(">>> [DEBUG] Repository returned: " + (hotels != null ? hotels.size() : 0));

        if (hotels == null || hotels.isEmpty()) {
            return Collections.emptyList();
        }

        return hotels.stream().map(hotel -> {
            try {
                HotelDTO dto = new HotelDTO();
                dto.setId(hotel.getId());
                dto.setName(Optional.ofNullable(hotel.getName()).orElse("Unnamed Hotel"));
                dto.setLocation(Optional.ofNullable(hotel.getLocation()).orElse("Unknown Location"));
                dto.setStarRating(Optional.ofNullable(hotel.getStarRating()).orElse(0));
                dto.setContactNumber(Optional.ofNullable(hotel.getContactNumber()).orElse(""));
                dto.setDescription(Optional.ofNullable(hotel.getDescription()).orElse(""));
                dto.setStatus(hotel.getStatus());
                dto.setPropertyType(Optional.ofNullable(hotel.getPropertyType()).orElse(""));
                dto.setCity(Optional.ofNullable(hotel.getCity()).orElse(""));
                dto.setStartingPrice(Optional.ofNullable(hotel.getStartingPrice()).orElse(0.0));
                dto.setAverageRating(Optional.ofNullable(hotel.getAverageRating()).orElse(0.0));

                // Images safe map
                dto.setImages(hotel.getImages() != null
                        ? hotel.getImages().stream()
                        .filter(Objects::nonNull)
                        .map(img -> new HotelImageDTO(
                                img.getId(),
                                Optional.ofNullable(img.getImageUrl()).orElse("/default-hotel.jpg")
                        ))
                        .toList()
                        : Collections.emptyList());

                // Amenities safe map
                dto.setAmenities(hotel.getAmenities() != null
                        ? hotel.getAmenities().stream()
                        .filter(Objects::nonNull)
                        .map(a -> new AmenityDTO(a.getId(), a.getName()))
                        .toList()
                        : Collections.emptyList());

                return dto;
            } catch (Exception ex) {
                ex.printStackTrace();
                return null;
            }
        }).filter(Objects::nonNull).toList();
    }
}
