package com.springproject.hospitalitymanagnet.backend.service.impl;

import com.springproject.hospitalitymanagnet.backend.dto.BookingApiRequestDTO;
import com.springproject.hospitalitymanagnet.backend.dto.BookingDTO;
import com.springproject.hospitalitymanagnet.backend.dto.PaymentResultDTO;
import com.springproject.hospitalitymanagnet.backend.entity.Booking;
import com.springproject.hospitalitymanagnet.backend.entity.BookingStatus;
import com.springproject.hospitalitymanagnet.backend.entity.RoomType;
import com.springproject.hospitalitymanagnet.backend.entity.User;
import com.springproject.hospitalitymanagnet.backend.repository.BookingRepository;
import com.springproject.hospitalitymanagnet.backend.repository.PaymentRepository;
import com.springproject.hospitalitymanagnet.backend.repository.RoomTypeRepository;
import com.springproject.hospitalitymanagnet.backend.repository.UserRepository;
import com.springproject.hospitalitymanagnet.backend.service.BookingService;
import com.springproject.hospitalitymanagnet.backend.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * BookingServiceImpl - implements booking flows including payment-backed booking creation.
 *
 * Notes:
 * - PaymentService bean must be available and implement processPayment(...)
 * - Booking entity must declare a Payment field with cascade so the payment entity is persisted with the booking
 */
@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final RoomTypeRepository roomTypeRepository;
    private final PaymentService paymentService;
    private final PaymentRepository paymentRepository; // optional helper, can be null if unused

    private static final Logger logger = LoggerFactory.getLogger(BookingServiceImpl.class);

    public BookingServiceImpl(BookingRepository bookingRepository,
                              UserRepository userRepository,
                              RoomTypeRepository roomTypeRepository,
                              PaymentService paymentService,
                              PaymentRepository paymentRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.roomTypeRepository = roomTypeRepository;
        this.paymentService = paymentService;
        this.paymentRepository = paymentRepository;
    }

    @Override
    @Transactional
    public BookingDTO createBooking(Long userId, Integer roomTypeId, LocalDate checkIn, LocalDate checkOut, int guests) {
        RoomType room = roomTypeRepository.findById(roomTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + roomTypeId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        if (!"Available".equalsIgnoreCase(room.getAvailability())) {
            throw new IllegalArgumentException("Room is not available");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights <= 0) throw new IllegalArgumentException("Invalid dates: check-out must be after check-in");

        double rate = (room.getSpecialPrice() != null ? room.getSpecialPrice() : room.getBasePrice());
        double price = rate * nights;

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoomType(room);
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setGuests(guests);
        booking.setTotalPrice(price);
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking saved = bookingRepository.save(booking);

        // mark room unavailable
        room.setAvailability("Unavailable");
        roomTypeRepository.save(room);

        return toDTO(saved);
    }

    @Override
    public BookingDTO getBookingById(Long id) {
        return bookingRepository.findById(id)
                .map(this::toDTO)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + id));
    }

    @Override
    public List<BookingDTO> getBookingsByUser(Long userId) {
        return bookingRepository.findByUserId(userId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Override
    public List<BookingDTO> getAllBookings() {
        return bookingRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    /**
     * Cancel a booking safely:
     *  - idempotent
     *  - cancels booking status and attempts to set RoomType availability to Available only if no other active bookings exist
     */
    @Override
    @Transactional
    public BookingDTO cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found: " + bookingId));

        if (BookingStatus.CANCELLED.equals(booking.getStatus())) {
            logger.info("Booking {} already cancelled - nothing to do", bookingId);
            return toDTO(booking);
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        RoomType room = saved.getRoomType();
        if (room != null && room.getId() != null) {
            Integer roomTypeId = room.getId();
            Optional<RoomType> lockedOpt;
            try {
                lockedOpt = roomTypeRepository.findByIdForUpdate(roomTypeId);
            } catch (Throwable t) {
                logger.warn("findByIdForUpdate unavailable for RoomType {}: {}. Falling back to findById()", roomTypeId, t.getMessage());
                lockedOpt = roomTypeRepository.findById(roomTypeId);
            }
            RoomType lockedRoom = lockedOpt.orElse(room);

            long activeCount = bookingRepository.countByRoomTypeIdAndStatusNot(roomTypeId, BookingStatus.CANCELLED);
            if (activeCount == 0L) {
                lockedRoom.setAvailability("Available");
                roomTypeRepository.save(lockedRoom);
                logger.info("RoomType {} set to Available after cancelling booking {}", roomTypeId, bookingId);
            } else {
                logger.info("RoomType {} still has {} active booking(s); leaving availability unchanged", roomTypeId, activeCount);
            }
        }

        return toDTO(saved);
    }

    /**
     * Create booking with payment. This method attempts to auto-resolve roomTypeId
     * from hotelId + roomName (or roomName alone) if the client didn't supply roomTypeId.
     */
    @Override
    @Transactional
    public BookingDTO createBookingWithPayment(BookingApiRequestDTO req) {
        if (req == null) throw new IllegalArgumentException("Request body is required");
        if (req.getUserId() == null) throw new IllegalArgumentException("userId is required");
        if (req.getCheckIn() == null || req.getCheckOut() == null)
            throw new IllegalArgumentException("checkIn and checkOut are required");

        // --- Attempt to auto-resolve roomTypeId if missing ---
        if (req.getRoomTypeId() == null) {
            try {
                if (req.getHotelId() != null && req.getRoomName() != null) {
                    roomTypeRepository.findFirstByHotel_IdAndNameIgnoreCase(req.getHotelId(), req.getRoomName())
                            .ifPresent(rt -> req.setRoomTypeId(rt.getId()));
                }
                if (req.getRoomTypeId() == null && req.getRoomName() != null) {
                    roomTypeRepository.findFirstByNameIgnoreCase(req.getRoomName())
                            .ifPresent(rt -> req.setRoomTypeId(rt.getId()));
                }
            } catch (Exception e) {
                logger.warn("Auto-resolve roomTypeId failed: {}", e.getMessage());
            }
        }

        // If still null, fail early with helpful message
        if (req.getRoomTypeId() == null) {
            throw new IllegalArgumentException("roomTypeId is required (server attempted auto-resolution but failed)");
        }

        // parse dates
        LocalDate checkIn;
        LocalDate checkOut;
        try {
            checkIn = LocalDate.parse(req.getCheckIn());
            checkOut = LocalDate.parse(req.getCheckOut());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid date format for checkIn/checkOut. Use ISO yyyy-MM-dd", e);
        }

        // load room and user (same validations as createBooking)
        RoomType room = roomTypeRepository.findById(req.getRoomTypeId())
                .orElseThrow(() -> new IllegalArgumentException("Room not found: " + req.getRoomTypeId()));

        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + req.getUserId()));

        if (!"Available".equalsIgnoreCase(room.getAvailability())) {
            throw new IllegalArgumentException("Room is not available");
        }

        long nights = ChronoUnit.DAYS.between(checkIn, checkOut);
        if (nights <= 0) throw new IllegalArgumentException("Invalid dates: check-out must be after check-in");

        double rate = (room.getSpecialPrice() != null ? room.getSpecialPrice() : room.getBasePrice());
        double computedPrice = rate * nights;
        double totalPrice = req.getTotalPrice() != null ? req.getTotalPrice() : computedPrice;

        // ---------- PAYMENT ----------
        PaymentResultDTO payRes = paymentService.processPayment(req.getPayment(), totalPrice);

        if (payRes == null || !"SUCCESS".equalsIgnoreCase(payRes.getStatus())) {
            String msg = (payRes != null ? payRes.getMessage() : "Payment processor returned null/failed");
            throw new IllegalArgumentException("Payment failed: " + msg);
        }

        // ---------- CREATE BOOKING + PAYMENT ENTITY ----------
        Booking booking = new Booking();
        booking.setUser(user);
        booking.setRoomType(room);
        booking.setCheckInDate(checkIn);
        booking.setCheckOutDate(checkOut);
        booking.setGuests(req.getGuests() != null ? req.getGuests() : 1);
        booking.setTotalPrice(totalPrice);
        booking.setStatus(BookingStatus.CONFIRMED);

        com.springproject.hospitalitymanagnet.backend.entity.Payment paymentEntity =
                com.springproject.hospitalitymanagnet.backend.entity.Payment.builder()
                        .paymentProviderId(payRes.getPaymentId())
                        .provider(payRes.getProvider())
                        .method(payRes.getMethod())
                        .status(payRes.getStatus())
                        .amount(BigDecimal.valueOf(totalPrice))
                        .currency(payRes.getCurrency() != null ? payRes.getCurrency() : "USD")
                        .cardLast4(payRes.getCardLast4())
                        .cardBrand(payRes.getCardBrand())
                        .createdAt(LocalDateTime.now())
                        .build();

        booking.setPayment(paymentEntity); // requires Booking.payment @OneToOne(cascade = ALL)

        Booking saved = bookingRepository.save(booking);

        // mark room unavailable and save
        room.setAvailability("Unavailable");
        roomTypeRepository.save(room);

        return toDTO(saved);
    }

    // Convert Booking entity -> BookingDTO (includes payment details if present)
    private BookingDTO toDTO(Booking booking) {
        if (booking == null) return null;

        BookingDTO.BookingDTOBuilder b = BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUser() != null ? booking.getUser().getId() : null)
                .roomTypeId(booking.getRoomType() != null ? booking.getRoomType().getId() : null)
                .roomName(booking.getRoomType() != null ? booking.getRoomType().getName() : null)
                .checkInDate(booking.getCheckInDate())
                .checkOutDate(booking.getCheckOutDate())
                .guests(booking.getGuests())
                .totalPrice(booking.getTotalPrice())
                .status(booking.getStatus() != null ? booking.getStatus().name() : null);

        if (booking.getPayment() != null) {
            com.springproject.hospitalitymanagnet.backend.entity.Payment p = booking.getPayment();
            b.paymentProviderId(p.getPaymentProviderId());
            b.paymentStatus(p.getStatus());
            b.paymentAmount(p.getAmount() != null ? p.getAmount().doubleValue() : null);
            b.paymentCurrency(p.getCurrency());
            b.paymentCardLast4(p.getCardLast4());
            b.paymentProvider(p.getProvider());
        }

        return b.build();
    }
}
