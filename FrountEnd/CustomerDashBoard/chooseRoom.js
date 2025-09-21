// chooseRoom.js
// Safe, idempotent loader for hotel details + room selection + booking
// -> Doesn't change HTML ids/classes
// -> Guards against double-loads and missing DOM nodes

(function () {
    // Guard: prevent double-execution if the file is accidentally included twice
    if (window.__chooseRoomJsLoaded) {
        console.warn('chooseRoom.js already loaded - skipping duplicate load');
        return;
    }
    window.__chooseRoomJsLoaded = true;

    // -------------------------
    // Small helpers
    // -------------------------
    function $id(id) { return document.getElementById(id); }
    function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
    function safeSetText(id, txt) { const el = $id(id); if (el) el.textContent = txt; }
    function safeStyleHide(id) { const el = $id(id); if (el) el.style && (el.style.display = 'none'); }
    function safeStyleShow(id, display = 'block') { const el = $id(id); if (el) el.style && (el.style.display = display); }

    // -------------------------
    // Default images (scoped)
    // -------------------------
    const _defaultImages = [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800&h=600&fit=crop'
    ];

    // -------------------------
    // Get hotelId: url param or sessionStorage
    // -------------------------
    function getHotelId() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const urlId = urlParams.get('id');
            if (urlId) return urlId;
        } catch (e) { /* ignore */ }
        return sessionStorage.getItem('selectedHotelId') || null;
    }

    // -------------------------
    // Load hotel details (from backend) with defensive checks
    // -------------------------
    async function loadHotelDetails() {
        const hotelId = getHotelId();
        if (!hotelId) {
            showError('No hotel selected. Please select a hotel from the list.');
            return;
        }

        try {
            // Try cached
            const cached = sessionStorage.getItem('selectedHotel');
            if (cached) {
                const parsed = JSON.parse(cached);
                if (String(parsed.id) === String(hotelId)) {
                    displayHotelDetails(parsed);
                    return;
                }
            }

            const token = localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const res = await fetch(`http://localhost:8080/api/hotels/${hotelId}`, { headers });
            if (!res.ok) {
                const text = await res.text().catch(()=>res.statusText);
                throw new Error(`HTTP ${res.status}: ${text}`);
            }
            const json = await res.json();
            const hotel = json.data || json;

            const transformed = {
                id: hotel.id || hotel.hotelId,
                name: hotel.name || 'Hotel Name',
                address: hotel.address || hotel.location || 'Address not available',
                city: hotel.city || hotel.location || '',
                description: hotel.description || 'Welcome to our beautiful hotel.',
                pricePerNight: hotel.pricePerNight || hotel.startingPrice || 100,
                starRating: hotel.starRating || hotel.rating || 4,
                rating: hotel.averageRating || hotel.rating || 8.5,
                images: hotel.images || (hotel.hotelImages && hotel.hotelImages.map(i=>i.imageUrl)) || [],
                roomTypes: hotel.roomTypes || hotel.rooms || [],
                amenities: hotel.amenities || hotel.facilities || []
            };

            // cache transformed for UI speed
            try { sessionStorage.setItem('selectedHotel', JSON.stringify(transformed)); } catch (e) {}

            displayHotelDetails(transformed);
        } catch (err) {
            console.error('loadHotelDetails error', err);
            showError('Unable to load hotel details. ' + (err.message || ''));
        }
    }

    // -------------------------
    // Display hotel details (defensive)
    // -------------------------
    function displayHotelDetails(hotel) {
        // Make UI visible only if elements exist
        const loadingEl = $id('loading-state');
        if (loadingEl && loadingEl.style) loadingEl.style.display = 'none';

        const containerEl = $id('hotel-container');
        if (containerEl && containerEl.style) containerEl.style.display = 'block';

        if (hotel.name) safeSetText('hotel-name', hotel.name);
        if (hotel.address) safeSetText('hotel-address', hotel.address);
        if (hotel.city || hotel.location) safeSetText('hotel-location', hotel.city || hotel.location);
        if (typeof hotel.description !== 'undefined') safeSetText('hotel-description', hotel.description);

        // rating & stars
        safeSetText('hotel-rating', hotel.rating || '8.5');
        const stars = '⭐'.repeat(Math.min(hotel.starRating || 4, 5));
        safeSetText('hotel-stars', stars);

        // price
        safeSetText('price-per-night', hotel.pricePerNight || 100);
        safeSetText('total-price', hotel.pricePerNight || 100);

        displayImages(hotel.images);
        displayRooms(hotel.roomTypes);
        displayAmenities(hotel.amenities);

        // default dates (if DOM elements exist)
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        try {
            const fmt = d=>d.toLocaleDateString();
            if ($id('check-in')) $id('check-in').textContent = fmt(today);
            if ($id('check-out')) $id('check-out').textContent = fmt(tomorrow);
        } catch (e) {}
    }

    // -------------------------
    // Images
    // -------------------------
    function displayImages(images) {
        const gallery = $id('image-gallery');
        if (!gallery) return;
        gallery.innerHTML = '';

        const imagesToShow = (images && images.length) ? images : _defaultImages;
        imagesToShow.slice(0,5).forEach((img, i) => {
            const url = (typeof img === 'string') ? img : (img.imageUrl || img.url || _defaultImages[i]);
            const div = document.createElement('div');
            div.className = 'gallery-item';
            div.innerHTML = `<img src="${url}" alt="Hotel Image ${i+1}" onerror="this.src='${_defaultImages[i]}'">`;
            gallery.appendChild(div);
        });
    }

    // -------------------------
    // Rooms (render + filter)
    // -------------------------
    window._originalRoomList = [];

    function displayRooms(rooms) {
        if (!rooms || rooms.length === 0) {
            rooms = [
                { id: 0, name: 'Standard Room', capacity: 2, basePrice: 100, features: 'Queen bed, City view', availability: 'Available' },
                { id: 1, name: 'Deluxe Room', capacity: 3, basePrice: 150, features: 'King bed, Sea view', availability: 'Unavailable' },
                { id: 2, name: 'Suite', capacity: 4, basePrice: 250, features: 'Living area, King bed', availability: 'Available' }
            ];
        }
        window._originalRoomList = rooms;
        applyRoomFilter();
    }

    function applyRoomFilter() {
        const cb = $id('filter-available');
        const showOnlyAvailable = cb && cb.checked;
        const roomsToRender = showOnlyAvailable ? window._originalRoomList.filter(r => (r.availability || '').toLowerCase() === 'available') : window._originalRoomList;
        renderRoomCards(roomsToRender);
    }

    function renderRoomCards(rooms) {
        const container = $id('room-cards');
        if (!container) return;
        container.innerHTML = '';

        rooms.forEach(room => {
            const price = room.basePrice || room.pricePerNight || 100;
            const features = room.inclusions ? room.inclusions.join(', ') : (room.bedType || room.features || 'Queen bed');
            const isAvailable = (room.availability || '').toLowerCase() === 'available';

            const card = document.createElement('div');
            card.className = 'room-card' + (isAvailable ? '' : ' unavailable');

            card.innerHTML = `
        <div class="room-name">${room.name}</div>
        <div class="room-details">
          <span>👥 ${room.capacity || 2} Guests</span>
          <span>🛏️ ${features}</span>
        </div>
        <div class="room-price">$${price}/night</div>
        <button class="room-book-btn" ${isAvailable ? '' : 'disabled'} data-roomid="${room.id}">
          ${isAvailable ? 'Select Room ✅' : 'Unavailable ❌'}
        </button>
      `;
            container.appendChild(card);
        });

        // delegate click handlers for book buttons
        container.querySelectorAll('.room-book-btn').forEach(btn => {
            btn.removeEventListener('click', onRoomBookClick);
            btn.addEventListener('click', onRoomBookClick);
        });

        const counter = $id('rooms-count');
        if (counter) counter.textContent = `${rooms.length} room${rooms.length !== 1 ? 's' : ''}`;
    }

    function onRoomBookClick(e) {
        const btn = e.currentTarget;
        if (btn.disabled) return;
        const roomId = btn.dataset.roomid;
        openBookingModal(roomId);
    }

    // -------------------------
    // Amenities
    // -------------------------
    const amenityMap = {
        'wifi': { icon: '📶', name: 'Free WiFi' },
        'pool': { icon: '🏊', name: 'Swimming Pool' },
        'breakfast': { icon: '🍳', name: 'Breakfast Included' },
        'parking': { icon: '🚗', name: 'Free Parking' },
        'gym': { icon: '🏋️', name: 'Fitness Center' },
        'restaurant': { icon: '🍷', name: 'Restaurant & Bar' },
        'air': { icon: '❄️', name: 'Air Conditioning' },
        'laundry': { icon: '🧺', name: 'Laundry Service' },
        'cancellation': { icon: '❌', name: 'Free Cancellation' },
        'front desk': { icon: '🕐', name: '24-Hour Front Desk' }
    };

    function displayAmenities(amenities) {
        const container = $id('amenities-grid');
        if (!container) return;
        container.innerHTML = '';

        const defaultA = [
            { icon: '📶', name: 'Free WiFi' },
            { icon: '🏊', name: 'Swimming Pool' },
            { icon: '🍳', name: 'Breakfast Included' },
            { icon: '🚗', name: 'Free Parking' },
            { icon: '🏋️', name: 'Fitness Center' },
        ];

        const list = (amenities && amenities.length) ? amenities.map(a => {
            const raw = typeof a === 'string' ? a : (a.name || a.amenityName || a);
            const key = String(raw).toLowerCase();
            const matched = Object.keys(amenityMap).find(k => key.includes(k));
            return matched ? amenityMap[matched] : { icon: '✓', name: raw };
        }) : defaultA;

        list.forEach(item => {
            const node = document.createElement('div');
            node.className = 'amenity-item';
            node.innerHTML = `<span class="amenity-icon">${item.icon}</span><span>${item.name}</span>`;
            container.appendChild(node);
        });
    }

    // -------------------------
    // Errors / UI helpers
    // -------------------------
    function showError(msg) {
        safeStyleHide('loading-state');
        const err = $id('error-state');
        if (err) {
            err.style.display = 'block';
            const msgEl = $id('error-message');
            if (msgEl) msgEl.textContent = msg;
        } else {
            alert(msg);
        }
    }

    // -------------------------
    // Navigation helper
    // -------------------------
    function goBackToHotels() {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'DashBoardSample02.html';
    }
    window.goBackToHotels = goBackToHotels;

    // -------------------------
    // Booking modal open/close + form submit
    // -------------------------
    function openBookingModal(roomId) {
        const modal = $id('booking-modal');
        if (!modal) { console.warn('booking-modal element not found'); return; }
        $id('roomId').value = roomId;

        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const toISO = d => d.toISOString().split('T')[0];
        const ci = $id('modal-check-in'), co = $id('modal-check-out'), guests = $id('modal-guests');
        if (ci) ci.value = toISO(today);
        if (co) co.value = toISO(tomorrow);
        if (guests) guests.value = 1;
        modal.style.display = 'flex';
    }

    function closeBookingModal() {
        const modal = $id('booking-modal');
        if (modal) modal.style.display = 'none';
    }

    // Submit booking form handler (uses fetch POST to backend)
    async function submitBookingForm(e) {
        e.preventDefault();
        const roomId = ($id('roomId') && $id('roomId').value) || null;
        const checkIn = $id('modal-check-in')?.value || null;
        const checkOut = $id('modal-check-out')?.value || null;
        const guests = $id('modal-guests')?.value || '1';

        if (!roomId || !checkIn || !checkOut) {
            alert('Please select check-in/check-out and a room');
            return;
        }

        // Build form-encoded data because controller uses @RequestParam
        const data = new URLSearchParams({
            userId: String(1), // TODO: replace with real user id (from token)
            roomTypeId: String(roomId),
            checkIn,
            checkOut,
            guests: String(guests)
        });

        try {
            const token = localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const res = await fetch('http://localhost:8080/api/bookings', {
                method: 'POST',
                headers,
                body: data.toString()
            });

            const bodyText = await res.text().catch(()=>null);
            console.log('Booking POST status:', res.status, bodyText);

            if (!res.ok) {
                let errMsg = bodyText || `Booking failed: ${res.status} ${res.statusText}`;
                try {
                    const parsed = JSON.parse(bodyText);
                    errMsg = parsed.message || parsed.error || bodyText;
                } catch (err) {}
                throw new Error(errMsg);
            }

            // parse booking response if it returned JSON
            let booking = null;
            try { booking = JSON.parse(bodyText); } catch (err) { booking = null; }

            // Build bookingDetails object (what BookingDetailsLoader expects)
            const bookingDetails = {
                bookingId: booking?.id || booking?.bookingId || ('local_' + Date.now()),
                roomName: booking?.roomName || (window._originalRoomList.find(r => String(r.id) === String(roomId))?.name || 'Room'),
                totalPrice: booking?.totalPrice || booking?.total_price || null,
                checkIn,
                checkOut,
                guests: Number(guests),
                hotelDetails: getCurrentHotelDetails(),
                bookingDate: new Date().toISOString()
            };

            // Save for BookingDetails page
            try { sessionStorage.setItem('currentBookingDetails', JSON.stringify(bookingDetails)); } catch (e) {}

            // Update UI: disable booked room
            disableRoomInUI(roomId);

            closeBookingModal();
            alert('Booking confirmed! Redirecting to Booking Details page...');

            // Redirect: if host dashboard has function loadBookingDetails, call it; else open standalone page
            setTimeout(() => {
                if (window.loadBookingDetails) {
                    try { window.loadBookingDetails(); } catch (err) { window.location.href = 'BookingDetailsLoader.html'; }
                } else {
                    window.location.href = 'BookingDetailsLoader.html';
                }
            }, 700);

        } catch (err) {
            console.error('Booking error:', err);
            alert('Error booking room: ' + (err.message || err));
        }
    }

    // Helper to disable booked room in UI
    function disableRoomInUI(roomId) {
        const container = $id('room-cards');
        if (!container) return;
        const btn = container.querySelector(`.room-book-btn[data-roomid="${roomId}"]`);
        if (btn) {
            btn.disabled = true;
            btn.innerText = 'Unavailable ❌';
            btn.style.background = '#ccc';
            btn.style.cursor = 'not-allowed';
            const card = btn.closest('.room-card');
            if (card) card.classList.add('unavailable');
        }
    }

    // get current hotel details from DOM (for booking details)
    function getCurrentHotelDetails() {
        try {
            return {
                name: $id('hotel-name')?.textContent || '',
                address: $id('hotel-address')?.textContent || '',
                location: $id('hotel-location')?.textContent || '',
                rating: $id('hotel-rating')?.textContent || '',
                stars: $id('hotel-stars')?.textContent || '',
                description: $id('hotel-description')?.textContent || '',
                pricePerNight: $id('price-per-night')?.textContent || '',
                image: document.querySelector('#image-gallery img')?.src || _defaultImages[0]
            };
        } catch (err) {
            console.error('Error reading current hotel details', err);
            return {};
        }
    }

    // -------------------------
    // Wiring on DOMContentLoaded
    // -------------------------
    function init() {
        // load hotel details (if id provided)
        loadHotelDetails().catch(err => console.error('loadHotelDetails error', err));

        // filter checkbox change
        const cb = $id('filter-available');
        if (cb) cb.addEventListener('change', applyRoomFilter);

        // booking form submit
        const bookingForm = $id('booking-form');
        if (bookingForm) {
            bookingForm.removeEventListener('submit', submitBookingForm);
            bookingForm.addEventListener('submit', submitBookingForm);
        }

        // modal click outside to close
        const bookingModal = $id('booking-modal');
        if (bookingModal) {
            bookingModal.addEventListener('click', (ev) => {
                if (ev.target && ev.target.id === 'booking-modal') closeBookingModal();
            });
        }
    }

    // run init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // expose a few useful functions globally (keeps old inline onclicks working)
    window.openBookingModal = openBookingModal;
    window.closeBookingModal = closeBookingModal;
    window.disableRoomInUI = disableRoomInUI;
    window.getCurrentHotelDetails = getCurrentHotelDetails;

})(); // end IIFE
