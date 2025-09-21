// paymentAllMostDone.js
// Loads booking confirmation from sessionStorage or backend and fills the confirmation page.
// Place this file on your confirmation HTML (paymentAllMostDone.html).
(function () {
    'use strict';

    const BACKEND_ORIGIN = window.__BACKEND_ORIGIN__ || 'http://localhost:8080';

    function safeParse(s) {
        try { return JSON.parse(s); } catch (e) { return null; }
    }

    function getQueryParam(name) {
        return new URL(window.location.href).searchParams.get(name);
    }

    function fmtDate(iso) {
        if (!iso) return '—';
        try {
            const d = new Date(iso);
            return d.toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
        } catch (e) { return String(iso); }
    }

    // Try to find element by text label (optional helper)
    function findValueByLabelText(labelText) {
        // Finds .info-item where the .info-label text contains labelText, return its .info-value
        const labels = Array.from(document.querySelectorAll('.info-item'));
        for (const li of labels) {
            const lbl = li.querySelector('.info-label');
            if (lbl && lbl.textContent && lbl.textContent.trim().toLowerCase().includes(labelText.toLowerCase())) {
                return li.querySelector('.info-value') || null;
            }
        }
        return null;
    }

    // Populate DOM with booking object (expected shape: BookingDTO or similar)
    function populateUI(booking) {
        if (!booking) return;

        // 1) Confirmation number (try specific, else fallback)
        // In your HTML you have .confirmation-section and an .info-value inside it (first occurrence is confirmation).
        const confirmEl = (document.querySelector('.confirmation-section .info-value')
            || document.querySelector('.info-grid .info-item .info-value')
            || document.querySelector('.info-value'));
        if (confirmEl) confirmEl.textContent = booking.bookingId || booking.id || booking._id || '—';

        // 2) Payment details (Amount, Payment method, Transaction date)
        // Try to find by ordering inside confirmation-section .info-item .info-value
        const confValues = Array.from(document.querySelectorAll('.confirmation-section .info-item .info-value'));
        if (confValues.length >= 1 && booking.totalPrice !== undefined) {
            confValues[0].textContent = `$${Number(booking.totalPrice).toFixed(2)}`;
        } else {
            // fallback: try labels
            const amtByLabel = findValueByLabelText('Amount charged') || findValueByLabelText('Amount');
            if (amtByLabel && booking.totalPrice !== undefined) amtByLabel.textContent = `$${Number(booking.totalPrice).toFixed(2)}`;
        }

        if (confValues.length >= 2) {
            if (booking.paymentCardLast4) confValues[1].textContent = '**** **** **** ' + booking.paymentCardLast4;
            else if (booking.paymentProviderId) confValues[1].textContent = booking.paymentProviderId;
            else confValues[1].textContent = booking.paymentProvider || booking.paymentMethod || '—';
        } else {
            const pmByLabel = findValueByLabelText('Payment Method') || findValueByLabelText('Method');
            if (pmByLabel) {
                pmByLabel.textContent = booking.paymentCardLast4 ? '**** **** **** ' + booking.paymentCardLast4 : (booking.paymentProviderId || booking.paymentProvider || booking.paymentMethod || '—');
            }
        }

        if (confValues.length >= 3) {
            const tx = booking.paymentDate || booking.bookingDate || booking.createdAt || booking.payment?.createdAt;
            confValues[2].textContent = fmtDate(tx);
        } else {
            const txByLabel = findValueByLabelText('Transaction Date') || findValueByLabelText('Date');
            if (txByLabel) {
                const tx = booking.paymentDate || booking.bookingDate || booking.createdAt || booking.payment?.createdAt;
                txByLabel.textContent = fmtDate(tx);
            }
        }

        // 3) Hotel info
        const hotelNameEl = document.querySelector('.hotel-name');
        if (hotelNameEl && (booking.hotelDetails?.name || booking.hotelName || booking.roomName)) {
            hotelNameEl.textContent = booking.hotelDetails?.name || booking.hotelName || booking.roomName;
        }
        const hotelLocEl = document.querySelector('.hotel-location');
        if (hotelLocEl && (booking.hotelDetails?.location || booking.location)) {
            hotelLocEl.textContent = booking.hotelDetails?.location || booking.location;
        }

        // 4) Stay details (checkin / checkout / duration / room)
        try {
            const nodes = Array.from(document.querySelectorAll('.stay-details .info-item .info-value'));
            const ci = booking.checkIn || booking.checkInDate;
            const co = booking.checkOut || booking.checkOutDate;
            if (nodes && nodes.length >= 4) {
                if (ci) nodes[0].textContent = fmtDate(ci) + (booking.checkInTime ? ` (${booking.checkInTime})` : ' (3:00 PM)');
                if (co) nodes[1].textContent = fmtDate(co) + (booking.checkOutTime ? ` (${booking.checkOutTime})` : ' (12:00 PM)');
                const nights = booking.nights || booking.totalNights || (ci && co ? Math.max(0, Math.ceil((new Date(co)-new Date(ci))/(1000*60*60*24))) : '—');
                nodes[2].textContent = (typeof nights === 'number' ? `${nights} nights` : nights);
                nodes[3].textContent = booking.roomName || booking.room || booking.roomTypeName || '—';
            } else {
                // fallback: try specific label-based elements if your markup differs
                const checkInByLabel = findValueByLabelText('Check-in');
                const checkOutByLabel = findValueByLabelText('Check-out');
                const durByLabel = findValueByLabelText('Duration') || findValueByLabelText('Number of nights');
                const roomByLabel = findValueByLabelText('Room');
                if (checkInByLabel && ci) checkInByLabel.textContent = fmtDate(ci);
                if (checkOutByLabel && co) checkOutByLabel.textContent = fmtDate(co);
                if (durByLabel) {
                    const nights = booking.nights || booking.totalNights || (ci && co ? Math.max(0, Math.ceil((new Date(co)-new Date(ci))/(1000*60*60*24))) : '—');
                    durByLabel.textContent = (typeof nights === 'number' ? `${nights} nights` : nights);
                }
                if (roomByLabel) roomByLabel.textContent = booking.roomName || booking.roomTypeName || '—';
            }
        } catch (e) {
            console.warn('populate stay-details failed', e);
        }

        // 5) Price summary right column (price per night, nights, taxes, total)
        try {
            // price per night element: .price-summary .price-row:first-child span:last-child
            const pricePerNightEl = document.querySelector('.price-summary .price-row:first-child span:last-child');
            const t = booking.pricePerNight || booking.hotelDetails?.pricePerNight || booking.pricePerNight || booking.rate || null;
            if (pricePerNightEl && t != null) pricePerNightEl.textContent = `$${Number(t).toFixed(2)}`;

            // nights
            const nightsEl = Array.from(document.querySelectorAll('.price-summary .price-row')).find(r => /nights|Number of nights/i.test((r.textContent||'')));
            if (nightsEl) {
                const nights = booking.nights || booking.totalNights || booking.nightsCount || (booking.checkIn && booking.checkOut ? Math.max(0, Math.ceil((new Date(booking.checkOut || booking.checkOutDate) - new Date(booking.checkIn || booking.checkInDate))/(1000*60*60*24))) : null);
                const valEl = nightsEl.querySelector('.price-value') || nightsEl.querySelector('span:last-child') || nightsEl.querySelector('.info-value');
                if (valEl && nights != null) valEl.textContent = String(nights);
            }

            // taxes and fees: best-effort (if booking.taxes exists)
            const taxesEl = Array.from(document.querySelectorAll('.price-summary .price-row')).find(r => /tax|fee/i.test((r.textContent||'')));
            if (taxesEl && booking.taxes != null) {
                const val = taxesEl.querySelector('span:last-child') || taxesEl.querySelector('.price-value');
                if (val) val.textContent = `$${Number(booking.taxes).toFixed(2)}`;
            }

            // total
            const totalEl = document.querySelector('.price-summary .total-row .total-value') || document.querySelector('.price-summary .total-row span:last-child') || document.querySelector('.total-value');
            if (totalEl && booking.totalPrice != null) totalEl.textContent = `$${Number(booking.totalPrice).toFixed(2)}`;
        } catch (e) {
            console.warn('populate price summary failed', e);
        }
    } // end populateUI

    // Try to fetch booking by id (with Authorization header if available)
    async function fetchBookingById(id) {
        if (!id) return null;
        const token = localStorage.getItem('accessToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch(`${BACKEND_ORIGIN}/api/bookings/${encodeURIComponent(id)}`, { headers });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Failed to load booking (status ${res.status}): ${text || res.statusText}`);
        }
        return res.json();
    }

    // Run loader
    (async function run() {
        try {
            // 1) try sessionStorage first
            let booking = safeParse(sessionStorage.getItem('lastCompletedBooking')) || safeParse(sessionStorage.getItem('currentBookingDetails'));

            // 2) if not in sessionStorage, try bookingId from URL and fetch from backend
            if (!booking) {
                const qid = getQueryParam('bookingId');
                if (qid) {
                    booking = await fetchBookingById(qid);
                }
            }

            // 3) populate UI or show friendly message
            if (booking) {
                populateUI(booking);
            } else {
                const container = document.querySelector('.booking-details') || document.body;
                container.innerHTML = '<div style="padding:20px">Booking not found or session expired. Check your email or contact support.</div>';
            }
        } catch (err) {
            console.error('paymentAllMostDone loader error', err);
            const container = document.querySelector('.booking-details') || document.body;
            container.innerHTML = `<div style="padding:20px">Could not load booking details: ${err.message || err}</div>`;
        }
    })();

})(); // EOF
