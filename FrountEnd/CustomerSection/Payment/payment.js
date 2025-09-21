// payment.js - frontend for Book & Pay (compatible with BookingApiRequestDTO on backend)
//
// Behavior:
//  - Populate UI from sessionStorage.currentBookingDetails (if present).
//  - Attempt to resolve roomTypeId via stored candidates and via GET /api/roomtypes.
//  - If still not found: send payload with roomTypeId: null but include hotelId & roomName
//    so the backend may try to resolve server-side (your backend must implement that).
//  - On success store returned booking in sessionStorage and navigate to confirmation page.
//
// SECURITY NOTE: This example uses a demo token. DO NOT send raw PAN/CVV to your backend in production.
// Use a payment gateway (Stripe, etc.) to tokenize payment details client-side and send token only.

(function () {
    'use strict';

    // =========== CONFIG ===========
    const BACKEND_ORIGIN = window.__BACKEND_ORIGIN__ || 'http://localhost:8080';
    const PROCESS_PATH = '/api/bookings/process';
    const ROOMTYPES_PATH = '/api/roomtypes'; // GET endpoint; controller exposes /api/roomtypes

    // =========== HELPERS ===========
    function safeParse(s) {
        try { return JSON.parse(s); } catch (e) { return null; }
    }

    function isoDateOnly(value) {
        if (!value) return null;
        const d = new Date(value);
        if (isNaN(d)) return null;
        return d.toISOString().split('T')[0];
    }

    function prettyDateIso(iso) {
        if (!iso) return '';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('en-US', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
        } catch(e) { return iso; }
    }

    // =========== UI POPULATION ===========
    function populateUIFromStorage() {
        const raw = sessionStorage.getItem('currentBookingDetails') || sessionStorage.getItem('paymentDetails');
        if (!raw) return null;
        const booking = safeParse(raw);
        if (!booking) return null;

        const hotelNameEl = document.querySelector('.hotel-name');
        const hotelLocEl  = document.querySelector('.hotel-location');
        const hotelImgEl  = document.querySelector('.hotel-card .hotel-image img');

        const hname = booking.hotelDetails?.name || booking.hotelName || booking.roomName || booking.name;
        const hloc  = booking.hotelDetails?.location || booking.hotelLocation || booking.location;
        const himg  = booking.hotelDetails?.image || booking.image || '';

        if (hotelNameEl && hname) hotelNameEl.textContent = hname;
        if (hotelLocEl && hloc) hotelLocEl.textContent = hloc;
        if (hotelImgEl && himg) hotelImgEl.src = himg;

        // Dates / nights
        try {
            const ci = booking.checkIn || booking.checkInDate;
            const co = booking.checkOut || booking.checkOutDate;
            const dateEls = document.querySelectorAll('.booking-dates .date-section .date-value');
            if (dateEls && dateEls.length >= 3) {
                if (ci) dateEls[0].textContent = prettyDateIso(ci);
                if (co) dateEls[1].textContent = prettyDateIso(co);
                if (ci && co) {
                    const nights = Math.max(0, Math.ceil((new Date(co) - new Date(ci)) / (1000*60*60*24)));
                    dateEls[2].textContent = String(nights);
                }
            }
        } catch (e) { console.warn('populate dates error', e); }

        // Room header & price
        const roomHeader = document.querySelector('.room-details h3');
        if (roomHeader && booking.roomName) roomHeader.textContent = booking.roomName;

        try {
            const pricePerNight = Number(booking.pricePerNight || booking.hotelDetails?.pricePerNight || booking.hotelRate || 0);
            const ppEl = document.querySelector('.price-summary .price-row:first-child span:last-child');
            if (ppEl && pricePerNight) ppEl.textContent = `$${pricePerNight.toFixed(2)}`;
            const totalEl = document.querySelector('.price-total span:last-child') || document.querySelector('.total-value');
            const total = booking.totalPrice !== undefined ? booking.totalPrice : (booking.total || booking.price || 0);
            if (totalEl && total !== undefined) totalEl.textContent = `$${Number(total).toFixed(2)}`;
        } catch(e) {}

        // Prefill guest fields if present
        try {
            const guest = booking.guest || {};
            const name = booking.guestName || (guest.firstName ? `${guest.firstName} ${guest.lastName || ''}` : null);
            if (name) {
                const parts = name.trim().split(/\s+/);
                const first = parts.shift() || '';
                const last = parts.join(' ') || '';
                const firstInput = document.querySelector('input[placeholder^="First name"]');
                const lastInput  = document.querySelector('input[placeholder^="Last name"]');
                if (firstInput) firstInput.value = first;
                if (lastInput) lastInput.value = last;
            }
            const emailVal = booking.email || guest.email;
            if (emailVal) {
                const emailInput = document.querySelector('input[type="email"]');
                if (emailInput) emailInput.value = emailVal;
            }
            if (booking.cardName) {
                const cardNameInput = document.querySelector('input[placeholder="Name on card *"]');
                if (cardNameInput) cardNameInput.value = booking.cardName;
            }
        } catch(e){}
        return booking;
    }

    // =========== FORM COLLECTION ===========
    function collectForm() {
        const first = (document.querySelector('input[placeholder^="First name"]') || {}).value || '';
        const last  = (document.querySelector('input[placeholder^="Last name"]') || {}).value || '';
        const email = (document.querySelector('input[type="email"]') || {}).value || '';
        const phone = (document.querySelector('.phone-input input') || {}).value || (document.querySelector('input[type="tel"]')||{}).value || '';
        const cardName = (document.querySelector('input[placeholder="Name on card *"]') || {}).value || '';
        // DO NOT send PAN/CVV to backend in production. Use gateway tokenization.
        const cardNumber = (document.querySelector('input[placeholder="Card number *"]') || {}).value || '';
        const expiry = (document.querySelector('input[placeholder="MM/YYYY *"]') || {}).value || '';
        const cvv = (document.querySelector('.cvv-container input') || {}).value || '';
        return { first, last, email, phone, cardName, cardNumber, expiry, cvv };
    }

    // =========== ROOM TYPE RESOLUTION ===========
    function localResolveRoomTypeId(booking) {
        if (!booking) return null;
        const candidates = [
            booking.roomTypeId,
            booking.room_type_id,
            booking.roomType?.id,
            booking.room?.id,
            booking.roomId,
            booking.room_id,
            booking.hotelDetails?.roomTypeId,
            booking.hotelDetails?.room_type_id,
            booking.hotelDetails?.roomTypes?.[0]?.id,
            booking.selectedRoomTypeId,
            booking.roomTypeIdFromUI
        ];
        for (const c of candidates) {
            if (c !== undefined && c !== null && c !== '') {
                const n = Number(c);
                if (!Number.isNaN(n) && Number.isFinite(n)) return Math.trunc(n);
            }
        }
        return null;
    }

    // Query backend /api/roomtypes and attempt to match
    async function backendResolveRoomTypeId(booking) {
        if (!booking) return null;
        try {
            const token = localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const url = `${BACKEND_ORIGIN}${ROOMTYPES_PATH}`;
            const res = await fetch(url, { method: 'GET', headers });
            if (!res.ok) {
                console.warn('Could not fetch roomtypes for resolution', res.status);
                return null;
            }
            const list = await res.json();
            if (!Array.isArray(list) || list.length === 0) return null;

            const hotelId = booking.hotelId || booking.hotelDetails?.id || booking.hotel_id;
            const name = (booking.roomName || booking.roomTypeName || booking.room_name || '').toString().trim().toLowerCase();

            if (hotelId && name) {
                const exact = list.find(rt => rt && rt.hotel && Number(rt.hotel.id) === Number(hotelId) &&
                    String(rt.name||'').trim().toLowerCase() === name);
                if (exact) return Number(exact.id);
            }

            if (hotelId) {
                const first = list.find(rt => rt && rt.hotel && Number(rt.hotel.id) === Number(hotelId));
                if (first) return Number(first.id);
            }

            if (name) {
                const nameMatch = list.find(rt => rt && (rt.name||'').trim().toLowerCase() === name);
                if (nameMatch) return Number(nameMatch.id);
            }
            return null;
        } catch (e) {
            console.warn('backendResolveRoomTypeId failed', e);
            return null;
        }
    }

    // =========== SEND BOOKING ===========
    async function sendBooking(booking, form) {
        if (!booking) throw new Error('Missing booking data');

        const checkInIso  = isoDateOnly(booking.checkIn || booking.checkInDate);
        const checkOutIso = isoDateOnly(booking.checkOut || booking.checkOutDate);

        // try local resolution
        let roomTypeId = localResolveRoomTypeId(booking);

        // try backend lookup if still missing
        if (!roomTypeId) {
            roomTypeId = await backendResolveRoomTypeId(booking);
        }

        // also allow hotelDetails.roomTypes passed from client as last local option
        if (!roomTypeId && booking.hotelDetails && Array.isArray(booking.hotelDetails.roomTypes) && booking.hotelDetails.roomTypes.length>0) {
            const first = booking.hotelDetails.roomTypes[0];
            if (first && (first.id || first.roomTypeId)) roomTypeId = Number(first.id || first.roomTypeId);
        }

        // Build payload matching BookingApiRequestDTO - include hotelId/roomName so server can try resolving
        const payload = {
            userId: Number(localStorage.getItem('userId') || booking.userId || booking.user?.id || 1),
            roomTypeId: roomTypeId === null || roomTypeId === undefined ? null : Number(roomTypeId),
            checkIn: checkInIso,
            checkOut: checkOutIso,
            guests: booking.guests || 1,
            totalPrice: Number(booking.totalPrice || booking.total || 0),
            // helper metadata for server-side resolution/debug
            hotelId: booking.hotelId || booking.hotelDetails?.id || null,
            roomName: booking.roomName || booking.roomTypeName || null,
            guest: {
                firstName: form.first,
                lastName: form.last,
                email: form.email,
                phone: form.phone
            },
            payment: {
                method: 'card',
                // demo token - replace with gateway token in production
                token: 'tok_demo_frontend_' + Date.now(),
                cardName: form.cardName || ''
            }
        };

        // Send to backend
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem('accessToken');
        if (token) headers['Authorization'] = 'Bearer ' + token;

        const url = `${BACKEND_ORIGIN}${PROCESS_PATH}`;
        const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });

        if (!res.ok) {
            const text = await res.text().catch(() => '');
            let message = text || `Server returned ${res.status}`;
            try { const j = JSON.parse(text); message = JSON.stringify(j); } catch(e){}
            throw new Error(`Booking API error: ${message}`);
        }

        const json = await res.json();
        // controller returns { booking: dto } or dto directly
        const bookingResult = json.booking || json;

        try { sessionStorage.setItem('lastCompletedBooking', JSON.stringify(bookingResult)); } catch(e) {}
        try { sessionStorage.setItem('currentBookingDetails', JSON.stringify(bookingResult)); } catch(e) {}

        return bookingResult;
    }

    // =========== BUTTON HANDLER ===========
    function initBookButton(bookingFromStorage) {
        const bookBtn = document.querySelector('.book-button');
        if (!bookBtn) {
            console.warn('payment.js: book-button not found');
            return;
        }

        bookBtn.addEventListener('click', async function handle(e) {
            e && e.preventDefault && e.preventDefault();
            const origText = bookBtn.textContent;
            try {
                bookBtn.disabled = true;
                bookBtn.textContent = 'Processing...';

                const form = collectForm();
                if (!form.first || !form.last || !form.email) {
                    throw new Error('Please fill First name, Last name and Email.');
                }

                const raw = sessionStorage.getItem('currentBookingDetails');
                const booking = raw ? safeParse(raw) : bookingFromStorage;
                if (!booking) throw new Error('Booking data missing. Please restart booking flow.');

                const result = await sendBooking(booking, form);

                const id = result.bookingId || result.id || result._id;
                if (id) {
                    window.location.href = `./paymentAllMostDone.html?bookingId=${encodeURIComponent(id)}`;
                } else {
                    window.location.href = './paymentAllMostDone.html';
                }
            } catch (err) {
                console.error('Book & Pay error', err);
                alert('Booking failed: ' + (err.message || err));
                bookBtn.disabled = false;
                bookBtn.textContent = origText || 'Book & Pay';
            }
        });
    }

    // =========== STARTUP ===========
    document.addEventListener('DOMContentLoaded', () => {
        const booking = populateUIFromStorage();
        initBookButton(booking);
    });

})(); // EOF
