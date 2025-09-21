package com.springproject.hospitalitymanagnet.backend.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Entity
@Table(name = "hotels")
public class Hotel {

     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Integer id;

     private String name;
     private String location;
     private Integer starRating;
     private String contactNumber;

     @Column(columnDefinition = "TEXT")
     private String description;

     private String status; // ACTIVE / INACTIVE

     // 🟢 New Fields
     private String propertyType;   // Hotel / Villa / Apartment / etc.
     private String city;           // Colombo / Kandy / etc.
     private Double startingPrice;  // Base starting price
     private Double averageRating = 0.0; // Default 0, updated from reviews later

     // Relations
     @OneToMany(mappedBy = "hotel", cascade = CascadeType.ALL, orphanRemoval = true)
     private List<HotelImage> images;

     // ✅ changed here: do not remove room types automatically to avoid FK error
     @OneToMany(
             mappedBy = "hotel",
             cascade = {CascadeType.PERSIST, CascadeType.MERGE},
             orphanRemoval = false
     )
     private List<RoomType> roomTypes;

     @ManyToMany
     @JoinTable(
             name = "hotel_amenities",
             joinColumns = @JoinColumn(name = "hotel_id"),
             inverseJoinColumns = @JoinColumn(name = "amenity_id")
     )
     private List<Amenity> amenities;

     // Hotel owns no relation for Policy
     @OneToOne(mappedBy = "hotel", cascade = CascadeType.ALL, orphanRemoval = true)
     private Policy policy;
}
