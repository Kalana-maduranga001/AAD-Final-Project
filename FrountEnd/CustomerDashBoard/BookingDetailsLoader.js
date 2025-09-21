// BookingDetailsLoader.js
// Fully self-contained. Does NOT modify your HTML structure or IDs.
// - Populates page from sessionStorage.currentBookingDetails
// - Exposes initializeBookingDetailsPage/populateBookingDetailsPage globally
// - Attaches robust "Next: Final details" handler that saves details and navigates to payment
// - Tries SPA navigation -> loader injection -> full-page navigation (most reliable)

(function () {
    'use strict';

    // ---------------- Utilities ----------------
    function safeParseJSON(s) {
        try { return JSON.parse(s); } catch (e) { return null; }
    }

    function q(sel, ctx) { return (ctx || document).querySelector(sel); }
    function qa(sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); }

    function fmtDateISOtoReadable(iso) {
        try {
            const dt = new Date(iso);
            if (isNaN(dt)) return '';
            return dt.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        } catch (e) { return ''; }
    }

    // ---------------- Load & populate logic ----------------

    // On initial injection: fill available elements immediately (simple)
    document.addEventListener('DOMContentLoaded', () => {
        const raw = sessionStorage.getItem('currentBookingDetails');
        if (!raw) {
            console.warn('No booking details in sessionStorage (currentBookingDetails)');
            return;
        }

        try {
            const d = safeParseJSON(raw);
            if (!d) { console.warn('Invalid booking details JSON'); return; }

            // hotel name/address
            qa('.hotel-name').forEach(el => el.textContent = d.hotelDetails?.name || d.hotelName || el.textContent);
            qa('.hotel-address').forEach(el => el.textContent = d.hotelDetails?.address || d.hotelAddress || el.textContent);

            // image
            const imgEl = q('.hotel-image img');
            if (imgEl && d.hotelDetails?.image) imgEl.src = d.hotelDetails.image;

            // dates
            const inDate = d.checkIn ? new Date(d.checkIn) : null;
            const outDate = d.checkOut ? new Date(d.checkOut) : null;
            const dateItems = qa('.dates-info .date-item');
            if (dateItems.length >= 2) {
                if (inDate && !isNaN(inDate)) {
                    const div = dateItems[0].querySelector('div');
                    if (div) div.textContent = fmtDateISOtoReadable(inDate.toISOString());
                }
                if (outDate && !isNaN(outDate)) {
                    const div = dateItems[1].querySelector('div');
                    if (div) div.textContent = fmtDateISOtoReadable(outDate.toISOString());
                }
            }

            // nights
            if (inDate && outDate && !isNaN(inDate) && !isNaN(outDate)) {
                const nights = Math.ceil((outDate - inDate) / (1000*60*60*24));
                const nightsEl = q('.stay-length span');
                if (nightsEl) nightsEl.textContent = `${nights} night${nights>1 ? 's' : ''}`;
            }

            // room/guests
            const roomSelectionDiv = q('.selected-room div');
            if (roomSelectionDiv) roomSelectionDiv.textContent = `${d.roomName || 'Room'} for ${d.guests || 1} adult${d.guests>1 ? 's' : ''}`;

            // room header
            const roomHeader = q('.room-details-card h3');
            if (roomHeader) roomHeader.textContent = d.roomName || roomHeader.textContent;

            // price
            qa('.current-price .amount').forEach(el => {
                if (d.totalPrice !== undefined && d.totalPrice !== null) el.textContent = `US$${Number(d.totalPrice).toFixed(2)}`;
            });

            // title
            document.title = `Booking Details - ${d.hotelDetails?.name || d.hotelName || ''}`;
            console.debug('Loaded booking details from sessionStorage');
        } catch (err) {
            console.error('Error parsing booking details', err);
        }
    });

    // ------------- Public initializer functions -------------
    function initializeBookingDetailsPage() {
        const bookingDetailsJson = sessionStorage.getItem('currentBookingDetails');
        if (!bookingDetailsJson) {
            console.warn('No booking details in sessionStorage (currentBookingDetails)');
            return;
        }
        try {
            const details = safeParseJSON(bookingDetailsJson);
            populateBookingDetailsPage(details);
        } catch (err) {
            console.error('Error parsing booking details from sessionStorage:', err);
        }
    }

    function populateBookingDetailsPage(details) {
        if (!details) return;

        // hotel name & address
        qa('.hotel-name').forEach(el => { if (details.hotelDetails?.name) el.textContent = details.hotelDetails.name; });
        qa('.hotel-address').forEach(el => { if (details.hotelDetails?.address) el.textContent = details.hotelDetails.address; });

        // image
        const hotelImg = q('.hotel-image img');
        if (hotelImg && details.hotelDetails?.image) {
            hotelImg.src = details.hotelDetails.image;
            hotelImg.alt = `${details.hotelDetails.name || 'Hotel'} image`;
        }

        // rating/stars
        const ratingEl = q('.review-score .score');
        if (ratingEl && details.hotelDetails?.rating !== undefined) ratingEl.textContent = details.hotelDetails.rating;
        const starsEl = q('.hotel-rating .stars');
        if (starsEl && details.hotelDetails?.stars !== undefined) starsEl.textContent = details.hotelDetails.stars;

        // dates formatting
        try {
            if (details.checkIn && details.checkOut) {
                const checkInDate = new Date(details.checkIn);
                const checkOutDate = new Date(details.checkOut);
                const dateOptions = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };

                const checkInDiv = q('.dates-info .date-item:first-child div');
                const checkInSmall = q('.dates-info .date-item:first-child small');
                if (checkInDiv && !isNaN(checkInDate)) checkInDiv.textContent = checkInDate.toLocaleDateString('en-US', dateOptions);
                if (checkInSmall) checkInSmall.textContent = details.hotelDetails?.checkInTime ? `From ${details.hotelDetails.checkInTime}` : '';

                const checkOutDiv = q('.dates-info .date-item:last-child div');
                const checkOutSmall = q('.dates-info .date-item:last-child small');
                if (checkOutDiv && !isNaN(checkOutDate)) checkOutDiv.textContent = checkOutDate.toLocaleDateString('en-US', dateOptions);
                if (checkOutSmall) checkOutSmall.textContent = details.hotelDetails?.checkOutTime ? `Until ${details.hotelDetails.checkOutTime}` : '';
            }
        } catch (e) {
            console.warn('Problem formatting dates', e);
        }

        // stay length
        if (details.checkIn && details.checkOut) {
            const nights = Math.ceil((new Date(details.checkOut) - new Date(details.checkIn)) / (1000 * 60 * 60 * 24));
            const stayLengthEl = q('.stay-length span');
            if (stayLengthEl) stayLengthEl.textContent = `${nights} night${nights !== 1 ? 's' : ''}`;
        }

        // room selection
        const roomSelectionDiv = q('.selected-room div');
        if (roomSelectionDiv) {
            const g = details.guests || 1;
            roomSelectionDiv.textContent = details.roomName ? `${details.roomName} for ${g} adult${g>1?'s':''}` : `1 room for ${g} adult${g>1?'s':''}`;
        }

        // selected room header
        const roomHeader = q('.room-details-card h3');
        if (roomHeader && details.roomName) roomHeader.textContent = details.roomName;

        // feature items update (guests)
        qa('.feature-item').forEach(fi => {
            if (/Guests/i.test(fi.textContent)) {
                if (fi.lastElementChild) fi.lastElementChild.textContent = `Guests: ${details.guests || 1} adult${(details.guests||1)>1?'s':''}`;
            }
        });

        // price fields
        if (details.totalPrice !== undefined && details.totalPrice !== null) {
            qa('.current-price .amount').forEach(el => el.textContent = `US$${Number(details.totalPrice).toFixed(2)}`);
            const priceRowEls = qa('.price-row span:last-child');
            if (priceRowEls.length > 0) priceRowEls[0].textContent = `US$${Number(details.totalPrice).toFixed(2)}`;
            const crossed = q('.crossed-price');
            if (crossed) crossed.textContent = `US$${(Number(details.totalPrice) * 1.1).toFixed(2)}`;
        }

        document.title = `Booking Details - ${details.hotelDetails?.name || 'Booking'}`;
    }

    // expose
    window.initializeBookingDetailsPage = initializeBookingDetailsPage;
    window.populateBookingDetailsPage = populateBookingDetailsPage;

    // ------------- Next -> Payment wiring (robust, HTML unchanged) -------------
    // Strategy:
    // 1) Save harvested details to sessionStorage
    // 2) Prefer SPA sidebar nav (click [data-page="payment"])
    // 3) Try known app helpers (navigateToPaymentDirectly / openPaymentPage)
    // 4) Attempt to inject payment.html using loadHtmlIntoContainer (if available)
    // 5) FINAL fallback: full-page navigation to a candidate payment URL (most reliable; avoids iframe sandbox issues)

    function harvestBookingDetailsFallback() {
        // return object similar to shape expected by payment page
        const existing = safeParseJSON(sessionStorage.getItem('currentBookingDetails'));
        if (existing) return existing;

        const details = { hotelDetails: {}, checkIn: null, checkOut: null, roomName: null, guests: 1, totalPrice: null };

        try {
            const hn = q('.hotel-name'); if (hn) details.hotelDetails.name = hn.textContent.trim();
            const img = q('.hotel-image img'); if (img && img.src) details.hotelDetails.image = img.src;

            const dateDivs = document.querySelectorAll('.dates-info .date-item div');
            if (dateDivs && dateDivs.length >= 2) {
                const inD = new Date(dateDivs[0].textContent.trim());
                const outD = new Date(dateDivs[1].textContent.trim());
                if (!isNaN(inD)) details.checkIn = inD.toISOString();
                if (!isNaN(outD)) details.checkOut = outD.toISOString();
            }

            const selRoom = q('.selected-room div');
            if (selRoom) {
                const text = selRoom.textContent.trim();
                const m = text.match(/(.+?)\s+for\s+(\d+)/i);
                if (m) { details.roomName = m[1].trim(); details.guests = Number(m[2]); }
                else details.roomName = text;
            }

            const priceEl = q('.current-price .amount') || q('.price-total span:last-child') || q('.total-value');
            if (priceEl) {
                const p = parseFloat(priceEl.textContent.replace(/[^0-9.\-]/g,''));
                if (!isNaN(p)) details.totalPrice = p;
            }
        } catch (e) {
            console.warn('[booking] harvest fallback error', e);
        }
        return details;
    }

    function saveBookingDetails(details) {
        try {
            sessionStorage.setItem('currentBookingDetails', JSON.stringify(details));
            console.debug('[booking] saved currentBookingDetails -> sessionStorage');
            return true;
        } catch (e) {
            console.warn('[booking] could not save currentBookingDetails', e);
            return false;
        }
    }

    function trySidebarPaymentClick() {
        const btn = document.querySelector('[data-page="payment"]');
        if (btn) {
            console.debug('[booking] clicking sidebar payment menu');
            btn.click();
            return true;
        }
        return false;
    }

    async function tryInjectPaymentUsingLoader() {
        if (typeof loadHtmlIntoContainer !== 'function') return false;

        // find container (do not disturb header)
        const container = document.getElementById('payment-page') || document.getElementById('main-content-area') || document.querySelector('main') || document.body;
        if (!container) return false;

        // place to inject: ensure #payment-content-area
        let paymentContent = container.querySelector('#payment-content-area');
        if (!paymentContent) {
            paymentContent = document.createElement('div');
            paymentContent.id = 'payment-content-area';
            container.appendChild(paymentContent);
        }

        const candidates = [
            'payment.html',
            './payment.html',
            '../payment.html',
            '../../FrountEnd/CustomerSection/Payment/payment.html',
            '../../FrountEnd/CustomerSection/Payment/index.html',
            window.location.origin + '/AAD-Final-Project/FrountEnd/CustomerSection/Payment/payment.html'
        ];

        for (const p of candidates) {
            try {
                const absolute = new URL(p, window.location.href).href;
                const r = await fetch(absolute, { method: 'GET', cache: 'no-store' });
                if (r.ok) {
                    console.debug('[booking] injecting payment from', absolute);
                    await loadHtmlIntoContainer(absolute, paymentContent);
                    // call initializer if injected script exposes it
                    if (typeof window.initializePaymentPage === 'function') {
                        try { window.initializePaymentPage(); } catch (e) { console.warn(e); }
                    } else {
                        setTimeout(() => { if (typeof window.initializePaymentPage === 'function') try { window.initializePaymentPage(); } catch (e) { console.warn(e); } }, 150);
                    }
                    container.classList.remove('hidden');
                    return true;
                }
            } catch (err) {
                console.debug('[booking] injection candidate failed', p, err);
            }
        }
        return false;
    }

    async function navigateToPaymentFullPage() {
        // ensure details saved
        const details = harvestBookingDetailsFallback();
        saveBookingDetails(details);

        const candidates = [
            window.location.origin + '/AAD-Final-Project/FrountEnd/CustomerSection/Payment/payment.html',
            '../../FrountEnd/CustomerSection/Payment/payment.html',
            '/FrountEnd/CustomerSection/Payment/payment.html',
            'payment.html',
            './payment.html'
        ];

        for (const p of candidates) {
            try {
                const url = new URL(p, window.location.href).href;
                const r = await fetch(url, { method: 'GET', cache: 'no-store' });
                if (r.ok) {
                    console.debug('[booking] navigating full-page to payment:', url);
                    window.location.href = url;
                    return;
                } else {
                    console.debug('[booking] candidate not available', url, r.status);
                }
            } catch (e) {
                console.debug('[booking] candidate fetch error', p, e);
            }
        }

        // final fallback: relative redirect
        const fallback = '../../FrountEnd/CustomerSection/Payment/payment.html';
        console.debug('[booking] final fallback redirect ->', fallback);
        window.location.href = fallback;
    }

    async function handleNextClick(ev) {
        try {
            if (ev && ev.preventDefault) ev.preventDefault();
            if (ev && ev.stopPropagation) ev.stopPropagation();

            console.log('[booking] Next clicked');

            // harvest + save
            const details = harvestBookingDetailsFallback();
            saveBookingDetails(details);

            // 1) attempt SPA sidebar
            if (trySidebarPaymentClick()) return;

            // 2) attempt global helper functions
            if (typeof window.navigateToPaymentDirectly === 'function') {
                try { window.navigateToPaymentDirectly(); return; } catch (e) { console.warn(e); }
            }
            if (typeof window.openPaymentPage === 'function') {
                try { window.openPaymentPage(); return; } catch (e) { console.warn(e); }
            }

            // 3) try loader injection (best-effort) - but fall back to full navigation if injection doesn't work
            try {
                const injected = await tryInjectPaymentUsingLoader();
                if (injected) return;
            } catch (e) {
                console.debug('[booking] injection threw', e);
            }

            // 4) final: full page navigate (most reliable and avoids sandbox/iframe issues)
            await navigateToPaymentFullPage();
        } catch (err) {
            console.error('[booking] handleNextClick error', err);
            try { await navigateToPaymentFullPage(); } catch (e) { /* ignore */ }
        }
    }

    // Attach click handlers (direct + delegated) without modifying HTML
    function attachNextHandlers() {
        try {
            const btn = document.querySelector('.next-button');
            if (btn && !btn.__bookingNextAttached) {
                // do not change HTML; just add handler and prevent default in handler
                btn.addEventListener('click', handleNextClick, { passive: false });
                btn.__bookingNextAttached = true;
                console.debug('[booking] attached direct click handler to .next-button');
            }
        } catch (e) {
            console.warn('[booking] attach direct failed', e);
        }

        if (!document.__bookingNextDelegateAttached) {
            document.addEventListener('click', function (ev) {
                const b = ev.target && ev.target.closest && ev.target.closest('.next-button');
                if (!b) return;
                handleNextClick(ev);
            }, { passive: false });
            document.__bookingNextDelegateAttached = true;
            console.debug('[booking] attached delegated click handler for .next-button');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', attachNextHandlers);
    } else {
        attachNextHandlers();
    }

    // Expose for debugging
    window.__booking_next = {
        attachNextHandlers,
        handleNextClick,
        harvestBookingDetailsFallback,
        saveBookingDetails,
        tryInjectPaymentUsingLoader,
        navigateToPaymentFullPage
    };

})();
