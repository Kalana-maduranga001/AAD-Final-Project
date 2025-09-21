// bookingDetailsLoader.js
// ==========================
// Reads `sessionStorage.currentBookingDetails` (set by chooseRoom.js) and fills the page
// ==========================
// bookingDetailsLoader.js
document.addEventListener('DOMContentLoaded', () => {
    const raw = sessionStorage.getItem('currentBookingDetails');
    if (!raw) {
        // nothing saved — keep page fallback content or show message
        console.warn('No booking details in sessionStorage (currentBookingDetails)');
        return;
    }

    try {
        const d = JSON.parse(raw);

        // hotel
        const hotelNameEls = document.querySelectorAll('.hotel-name');
        hotelNameEls.forEach(el => el.textContent = d.hotelDetails?.name || d.hotelName || el.textContent);

        const hotelAddressEls = document.querySelectorAll('.hotel-address');
        hotelAddressEls.forEach(el => el.textContent = d.hotelDetails?.address || d.hotelAddress || el.textContent);

        // image
        const imgEl = document.querySelector('.hotel-image img');
        if (imgEl && d.hotelDetails?.image) imgEl.src = d.hotelDetails.image;

        // dates
        const inDate = new Date(d.checkIn);
        const outDate = new Date(d.checkOut);
        const fmt = (dt) => dt.toLocaleDateString('en-US', { weekday: 'short', day:'numeric', month:'short', year:'numeric' });

        // Update the two date blocks: uses your markup .dates-info .date-item
        const dateItems = document.querySelectorAll('.dates-info .date-item');
        if (dateItems.length >= 2) {
            dateItems[0].querySelector('div') && (dateItems[0].querySelector('div').textContent = fmt(inDate));
            dateItems[1].querySelector('div') && (dateItems[1].querySelector('div').textContent = fmt(outDate));
        }

        // nights
        const nights = Math.ceil((outDate - inDate) / (1000*60*60*24));
        const nightsEl = document.querySelector('.stay-length span');
        if (nightsEl) nightsEl.textContent = `${nights} night${nights>1?'s':''}`;

        // room / guests
        const roomSelectionDiv = document.querySelector('.selected-room div');
        if (roomSelectionDiv) roomSelectionDiv.textContent = `${d.roomName || 'Room'} for ${d.guests || 1} adult${d.guests>1?'s':''}`;

        // room card name
        const roomHeader = document.querySelector('.room-details-card h3');
        if (roomHeader) roomHeader.textContent = d.roomName || roomHeader.textContent;

        // price
        const priceEls = document.querySelectorAll('.current-price .amount');
        priceEls.forEach(el => el.textContent = d.totalPrice ? `US$${Number(d.totalPrice).toFixed(2)}` : el.textContent);

        // update page title
        document.title = `Booking Details - ${d.hotelDetails?.name || d.hotelName || ''}`;

    } catch (err) {
        console.error('Error parsing booking details', err);
    }
});


function initializeBookingDetailsPage() {
    const bookingDetailsJson = sessionStorage.getItem('currentBookingDetails');
    if (!bookingDetailsJson) {
        console.warn('No booking details in sessionStorage (currentBookingDetails)');
        // keep original page content as-is or optionally show a message
        return;
    }

    try {
        const details = JSON.parse(bookingDetailsJson);
        populateBookingDetailsPage(details);
    } catch (err) {
        console.error('Error parsing booking details from sessionStorage:', err);
    }
}

function populateBookingDetailsPage(details) {
    if (!details) return;

    // Hotel name (your page uses .hotel-name)
    const hotelNameEls = document.querySelectorAll('.hotel-name');
    hotelNameEls.forEach(el => { if (details.hotelDetails?.name) el.textContent = details.hotelDetails.name; });

    // Hotel address
    const hotelAddressEls = document.querySelectorAll('.hotel-address');
    hotelAddressEls.forEach(el => {
        if (details.hotelDetails?.address) el.textContent = details.hotelDetails.address;
    });

    // Hotel image
    const hotelImg = document.querySelector('.hotel-image img');
    if (hotelImg && details.hotelDetails?.image) {
        hotelImg.src = details.hotelDetails.image;
        hotelImg.alt = `${details.hotelDetails.name || 'Hotel'} image`;
    }

    // Rating and stars
    const ratingEl = document.querySelector('.review-score .score');
    if (ratingEl && details.hotelDetails?.rating !== undefined) ratingEl.textContent = details.hotelDetails.rating;
    const starsEl = document.querySelector('.hotel-rating .stars');
    if (starsEl && details.hotelDetails?.stars !== undefined) starsEl.textContent = details.hotelDetails.stars;

    // Dates: your HTML structure has .dates-info .date-item
    try {
        if (details.checkIn && details.checkOut) {
            const checkInDate = new Date(details.checkIn);
            const checkOutDate = new Date(details.checkOut);
            const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };

            const checkInDiv = document.querySelector('.dates-info .date-item:first-child div');
            const checkInSmall = document.querySelector('.dates-info .date-item:first-child small');
            if (checkInDiv) checkInDiv.textContent = checkInDate.toLocaleDateString('en-US', dateOptions);
            if (checkInSmall) checkInSmall.textContent = details.hotelDetails?.checkInTime ? `From ${details.hotelDetails.checkInTime}` : '';

            const checkOutDiv = document.querySelector('.dates-info .date-item:last-child div');
            const checkOutSmall = document.querySelector('.dates-info .date-item:last-child small');
            if (checkOutDiv) checkOutDiv.textContent = checkOutDate.toLocaleDateString('en-US', dateOptions);
            if (checkOutSmall) checkOutSmall.textContent = details.hotelDetails?.checkOutTime ? `Until ${details.hotelDetails.checkOutTime}` : '';
        }
    } catch (e) {
        console.warn('Problem formatting dates', e);
    }

    // stay length
    if (details.checkIn && details.checkOut) {
        const nights = Math.ceil((new Date(details.checkOut) - new Date(details.checkIn)) / (1000 * 60 * 60 * 24));
        const stayLengthEl = document.querySelector('.stay-length span');
        if (stayLengthEl) stayLengthEl.textContent = `${nights} night${nights !== 1 ? 's' : ''}`;
    }

    // room selection text
    const roomSelectionDiv = document.querySelector('.selected-room div');
    if (roomSelectionDiv) {
        const g = details.guests || 1;
        roomSelectionDiv.textContent = details.roomName ? `${details.roomName} for ${g} adult${g > 1 ? 's' : ''}` : `1 room for ${g} adult${g > 1 ? 's' : ''}`;
    }

    // selected room header
    const roomHeader = document.querySelector('.room-details-card h3');
    if (roomHeader && details.roomName) roomHeader.textContent = details.roomName;

    // guest feature text update (there's a feature-item containing guests; we'll update the matching node)
    const featureItems = Array.from(document.querySelectorAll('.feature-item'));
    featureItems.forEach(fi => {
        // simple heuristic: replace 'Guests:' content if exists
        if (/Guests/i.test(fi.textContent)) {
            fi.querySelector('span') && (fi.lastElementChild.textContent = `Guests: ${details.guests || 1} adult${(details.guests || 1) > 1 ? 's' : ''}`);
        }
    });

    // price fields (your HTML uses .current-price .amount and .price-row)
    if (details.totalPrice !== undefined && details.totalPrice !== null) {
        const amountEls = document.querySelectorAll('.current-price .amount');
        amountEls.forEach(el => el.textContent = `US$${Number(details.totalPrice).toFixed(2)}`);

        const priceRowEls = document.querySelectorAll('.price-row span:last-child');
        if (priceRowEls.length > 0) {
            priceRowEls[0].textContent = `US$${Number(details.totalPrice).toFixed(2)}`;
        }

        const crossed = document.querySelector('.crossed-price');
        if (crossed) crossed.textContent = `US$${(Number(details.totalPrice) * 1.1).toFixed(2)}`;
    }

    // page title
    document.title = `Booking Details - ${details.hotelDetails?.name || 'Booking'}`;
}

// initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBookingDetailsPage);
} else {
    initializeBookingDetailsPage();
}

// Also make it available globally if some other script wants to call it:
window.initializeBookingDetailsPage = initializeBookingDetailsPage;
window.populateBookingDetailsPage = populateBookingDetailsPage;
