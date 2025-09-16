package com.springproject.hospitalitymanagnet.backend.service.impl;

import com.springproject.hospitalitymanagnet.backend.dto.AmenityDTO;
import com.springproject.hospitalitymanagnet.backend.dto.HotelDTO;
import com.springproject.hospitalitymanagnet.backend.dto.PolicyDTO;
import com.springproject.hospitalitymanagnet.backend.dto.RoomTypeDTO;
import com.springproject.hospitalitymanagnet.backend.entity.*;
import com.springproject.hospitalitymanagnet.backend.repository.AmenityRepository;
import com.springproject.hospitalitymanagnet.backend.repository.HotelRepository;
import com.springproject.hospitalitymanagnet.backend.service.HotelService;
import org.modelmapper.ModelMapper;
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

    public HotelServiceImpl(HotelRepository hotelRepository, AmenityRepository amenityRepository, ModelMapper modelMapper) {
        this.hotelRepository = hotelRepository;
        this.amenityRepository = amenityRepository;
        this.modelMapper = modelMapper;
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
    @Transactional
    public HotelDTO updateHotel(Integer id, HotelDTO hotelDTO) {
        Hotel hotel = hotelRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Hotel not found with ID: " + id));

        // Basic fields
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

        // Policy
        if (hotelDTO.getPolicy() != null) {
            if (hotel.getPolicy() == null) hotel.setPolicy(new Policy());
            hotel.getPolicy().setCheckInTime(hotelDTO.getPolicy().getCheckInTime());
            hotel.getPolicy().setCheckOutTime(hotelDTO.getPolicy().getCheckOutTime());
            hotel.getPolicy().setCancellationPolicy(hotelDTO.getPolicy().getCancellationPolicy());
            hotel.getPolicy().setAdditionalInfo(hotelDTO.getPolicy().getAdditionalInfo());
            hotel.getPolicy().setHotel(hotel);
        }

        // Amenities
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

        // Room types (replace)
        if (hotelDTO.getRoomTypes() != null) {
            hotel.getRoomTypes().clear();
            for (RoomTypeDTO rtDTO : hotelDTO.getRoomTypes()) {
                RoomType rt = new RoomType();
                rt.setId(rtDTO.getId());
                rt.setName(rtDTO.getName());
                rt.setBasePrice(rtDTO.getBasePrice());
                rt.setSpecialPrice(rtDTO.getSpecialPrice());
                rt.setRoomSize(rtDTO.getRoomSize());
                rt.setAvailability(rtDTO.getAvailability());
                rt.setInclusions(rtDTO.getInclusions());
                rt.setAmenities(rtDTO.getAmenities());
                rt.setHotel(hotel);
                hotel.getRoomTypes().add(rt);
            }
        }

        // --------------------
        // IMAGES: in-place merge (update existing, add new, remove missing)
        // --------------------
        if (hotelDTO.getImages() != null) {
            // ensure managed collection exists
            if (hotel.getImages() == null) hotel.setImages(new ArrayList<>());

            // Map existing managed images by id
            Map<Integer, HotelImage> existingById = hotel.getImages().stream()
                    .filter(img -> img.getId() != null)
                    .collect(Collectors.toMap(HotelImage::getId, img -> img));

            // Track incoming ids to know which to keep
            Set<Integer> incomingIds = new HashSet<>();

            // 1) Update managed ones and collect new ones to add
            List<HotelImage> imagesToAdd = new ArrayList<>();
            for (var imgDto : hotelDTO.getImages()) {
                Integer imgId = imgDto.getId();
                if (imgId != null && existingById.containsKey(imgId)) {
                    // update existing managed entity
                    HotelImage managed = existingById.get(imgId);
                    managed.setImageUrl(imgDto.getImageUrl());
                    managed.setHotel(hotel);
                    incomingIds.add(imgId);
                } else {
                    // new image -> create entity with id == null (let JPA insert)
                    HotelImage hi = new HotelImage();
                    hi.setImageUrl(imgDto.getImageUrl());
                    hi.setHotel(hotel);
                    imagesToAdd.add(hi);
                }
            }

            // 2) Remove any existing managed images that were not present in incoming DTOs
            // Use iterator to avoid ConcurrentModificationException
            Iterator<HotelImage> it = hotel.getImages().iterator();
            while (it.hasNext()) {
                HotelImage existing = it.next();
                Integer exId = existing.getId();
                if (exId != null && !incomingIds.contains(exId)) {
                    it.remove(); // removes from managed collection; with orphanRemoval=true it will delete on flush
                }
            }

            // 3) Add newly created images into the managed collection
            hotel.getImages().addAll(imagesToAdd);
        }

        // Save and return DTO
        Hotel updatedHotel = hotelRepository.save(hotel);
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
        List<Hotel> hotels = hotelRepository.findByStatus(status);
        System.out.println("Hotels found with status " + status + ": " + (hotels != null ? hotels.size() : 0));

        if (hotels == null || hotels.isEmpty()) {
            return Collections.emptyList();
        }

        return hotels.stream().map(hotel -> {
            HotelDTO dto = new HotelDTO();
            dto.setId(hotel.getId());
            dto.setName(Optional.ofNullable(hotel.getName()).orElse(""));
            dto.setLocation(Optional.ofNullable(hotel.getLocation()).orElse(""));
            dto.setStarRating(Optional.ofNullable(hotel.getStarRating()).orElse(0));
            dto.setContactNumber(Optional.ofNullable(hotel.getContactNumber()).orElse(""));
            dto.setDescription(Optional.ofNullable(hotel.getDescription()).orElse(""));
            dto.setStatus(hotel.getStatus());
            dto.setPropertyType(hotel.getPropertyType());
            dto.setCity(hotel.getCity());
            dto.setStartingPrice(hotel.getStartingPrice());
            dto.setAverageRating(hotel.getAverageRating());

            // images
            if (hotel.getImages() != null && !hotel.getImages().isEmpty()) {
                dto.setImages(hotel.getImages().stream()
                        .filter(Objects::nonNull)
                        .map(img -> new com.springproject.hospitalitymanagnet.backend.dto.HotelImageDTO(
                                img.getId(), img.getImageUrl()))
                        .collect(Collectors.toList()));
            } else {
                dto.setImages(Collections.emptyList());
            }

            // amenities
            if (hotel.getAmenities() != null && !hotel.getAmenities().isEmpty()) {
                dto.setAmenities(hotel.getAmenities().stream()
                        .filter(Objects::nonNull)
                        .map(a -> new com.springproject.hospitalitymanagnet.backend.dto.AmenityDTO(
                                a.getId(), a.getName()))
                        .collect(Collectors.toList()));
            } else {
                dto.setAmenities(Collections.emptyList());
            }

            return dto;
        }).collect(Collectors.toList());
    }


}
