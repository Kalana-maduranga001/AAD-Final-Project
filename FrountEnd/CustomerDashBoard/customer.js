
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality when DOM is loaded
    initializeFavorites();
    initializeTabSwitching();
    initializeExploreDestinations();
    initializeTripPlanner();
    initializeSearchFunctionality();
    initializeCategoryButtons();
    initializeDestinationClicks();
    initializeInputEffects();
    loadHotels();
});

// Add favorite functionality
function initializeFavorites() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            this.style.color = this.classList.contains('active') ? '#e74c3c' : '#666';
        });
    });
}

// Simple tab switching functionality
function initializeTabSwitching() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

// Explore destinations in Sri Lanka scroll functionality
function initializeExploreDestinations() {
    const container = document.getElementById('exploreContainer');
    const scrollLeftBtn = document.getElementById('scrollLeft');
    const scrollRightBtn = document.getElementById('scrollRight');
    if (!container || !scrollLeftBtn || !scrollRightBtn) return;

    const scrollAmount = 320;
    scrollLeftBtn.addEventListener('click', () => container.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    scrollRightBtn.addEventListener('click', () => container.scrollBy({ left: scrollAmount, behavior: 'smooth' }));

    function updateButtonStates() {
        const isAtStart = container.scrollLeft <= 0;
        const isAtEnd = container.scrollLeft >= (container.scrollWidth - container.clientWidth);
        scrollLeftBtn.style.opacity = isAtStart ? '0.5' : '1';
        scrollRightBtn.style.opacity = isAtEnd ? '0.5' : '1';
        scrollLeftBtn.style.pointerEvents = isAtStart ? 'none' : 'auto';
        scrollRightBtn.style.pointerEvents = isAtEnd ? 'none' : 'auto';
    }

    container.addEventListener('scroll', updateButtonStates);
    window.addEventListener('resize', updateButtonStates);
    updateButtonStates();
}

// Trip Planner functionality
function initializeTripPlanner() {
    const tripContainer = document.getElementById('tripDestinationsContainer');
    const tripScrollLeft = document.getElementById('tripScrollLeft');
    const tripScrollRight = document.getElementById('tripScrollRight');
    if (!tripContainer || !tripScrollLeft || !tripScrollRight) return;

    const scrollAmount = 320;
    tripScrollLeft.addEventListener('click', () => tripContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
    tripScrollRight.addEventListener('click', () => tripContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' }));

    function updateTripButtonStates() {
        const isAtStart = tripContainer.scrollLeft <= 0;
        const isAtEnd = tripContainer.scrollLeft >= (tripContainer.scrollWidth - tripContainer.clientWidth);
        tripScrollLeft.style.opacity = isAtStart ? '0.5' : '1';
        tripScrollRight.style.opacity = isAtEnd ? '0.5' : '1';
        tripScrollLeft.style.pointerEvents = isAtStart ? 'none' : 'auto';
        tripScrollRight.style.pointerEvents = isAtEnd ? 'none' : 'auto';
    }

    tripContainer.addEventListener('scroll', updateTripButtonStates);
    window.addEventListener('resize', updateTripButtonStates);
    updateTripButtonStates();
}

// Category buttons functionality
function initializeCategoryButtons() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            console.log('Selected category:', this.textContent.trim());
        });
    });
}

// Search functionality (currently just alert)
function initializeSearchFunctionality() {
    const searchBtn = document.querySelector('.search-btn-hero');
    const searchBtnRegular = document.querySelector('.search-btn');

    function handleSearch() {
        const destination = document.querySelector('input[placeholder="Where are you going?"]')?.value || 'New York';
        const dates = document.querySelector('.dates span')?.textContent || 'No dates selected';
        const guests = document.querySelector('.guests span')?.textContent || 'No guests selected';
        alert(`Search Details:\nDestination: ${destination}\nDates: ${dates}\nGuests: ${guests}`);
    }

    if (searchBtn) searchBtn.addEventListener('click', handleSearch);
    if (searchBtnRegular) searchBtnRegular.addEventListener('click', handleSearch);
}

// Destination item click functionality
function initializeDestinationClicks() {
    document.querySelectorAll('.destination-item').forEach(item => {
        item.addEventListener('click', function() {
            const destinationName = this.querySelector('h4').textContent;
            const distance = this.querySelector('p').textContent;
            alert(`You selected: ${destinationName}\nDistance: ${distance}`);
        });
    });
}

// Input focus effects
function initializeInputEffects() {
    document.querySelectorAll('.input-group-hero').forEach(group => {
        group.addEventListener('click', function() {
            document.querySelectorAll('.input-group-hero').forEach(g => g.classList.remove('focused'));
            this.classList.add('focused');
            const input = this.querySelector('input');
            if (input) input.focus();
        });
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.input-group-hero')) {
            document.querySelectorAll('.input-group-hero').forEach(g => g.classList.remove('focused'));
        }
    });
}

// Smooth scroll helper
function smoothScrollTo(element, to, duration) {
    const start = element.scrollLeft;
    const change = to - start;
    const startTime = performance.now();

    function animateScroll(currentTime) {
        const timeElapsed = currentTime - startTime;
        const run = easeInOutQuad(timeElapsed, start, change, duration);
        element.scrollLeft = run;
        if (timeElapsed < duration) requestAnimationFrame(animateScroll);
    }

    requestAnimationFrame(animateScroll);
}
function easeInOutQuad(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t + b;
    t--;
    return -c / 2 * (t * (t - 2) - 1) + b;
}

// Modified loadHotels function with only image fallback
// Update your existing loadHotels function - only modify the image part
async function loadHotels() {
    try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            console.error("No JWT token found in localStorage!");
            return;
        }

        const response = await fetch("http://localhost:8080/api/hotels/status/ACTIVE", {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            console.error("HTTP Error:", response.status, await response.text());
            return;
        }

        const result = await response.json();
        if (result.statusCode === 200) {
            const hotels = result.data;
            const container = document.getElementById("propertiesContainer");
            container.innerHTML = "";

            hotels.forEach((hotel, index) => {
                const card = document.createElement("div");
                card.classList.add("property-card");

                // Get backend image URL or use fallback
                const backendImage = hotel.images?.[0]?.imageUrl;
                const fallbackImage = getDefaultImageForHotel(index);

                card.innerHTML = `
                    <div class="property-image-container">
                        <img src="${backendImage || fallbackImage}" 
                             alt="${hotel.name}" 
                             class="property-image"
                             onerror="this.src='${fallbackImage}'; this.onerror=null;">
                        <button class="favorite-btn">
                            <svg viewBox="0 0 24 24">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="property-info">
                        <div class="property-name">${hotel.name}</div>
                        <div class="property-location">${hotel.city || hotel.location || ''}</div>
                        <div class="property-rating">
                            <div class="rating-score">${hotel.starRating || 0}★</div>
                            <div class="rating-text">
                                <div class="rating-label">${hotel.description || 'Hotel'}</div>
                                <div class="rating-reviews">Reviews available</div>
                            </div>
                        </div>
                    </div>
                `;

                // Keep your existing click handler
                card.addEventListener('click', () => {
                    if (typeof bookHotel === 'function') {
                        bookHotel(hotel.id);
                    }
                });

                container.appendChild(card);
            });

        } else {
            console.error("Failed to fetch hotels:", result.message);
        }
    } catch (err) {
        console.error("Error fetching hotels:", err);
    }
}

// Default images for fallback when backend images fail
function getDefaultImageForHotel(index) {
    const fallbackImages = [
        "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400&h=250&fit=crop",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop"
    ];
    return fallbackImages[index % fallbackImages.length];
}

function bookHotel(hotelId) {
    window.location.href = `AboutHotelBooking/HotelBookingPage.html?id=${hotelId}`;
}

// Refresh City wise Hotel Booking page
function refreshCityHotels() {
    console.log("Refreshing City wise Hotels Booking...");
    loadHotels();  // re-fetch and reload hotel cards
}


// Console log for debugging
console.log('BookStay JavaScript loaded successfully!');

// customer.js - robust loader + hotel listing + choose-room integration
// Save as customer.js and include on your dashboard page.

(() => {
    'use strict';

    // ---------- CONFIG ----------
    // If the probing fails set CHOOSE_ROOM_OVERRIDE to an absolute URL to your chooseRoom.html (copy from Network).
    // Example:
    // const CHOOSE_ROOM_OVERRIDE = "http://localhost:63342/AAD-Final-Project/FrountEnd/CustomerSection/ChooseROOM/chooseRoom.html";
    const CHOOSE_ROOM_OVERRIDE = null;

    const CHOOSE_ROOM_CANDIDATES = [
        () => CHOOSE_ROOM_OVERRIDE,
        () => (window.location.origin || '') + '/AAD-Final-Project/FrountEnd/CustomerSection/ChooseROOM/chooseRoom.html',
        () => (window.location.origin || '') + '/AAD-Final-Project/FrountEnd/CustomerDashBoard/AboutHotelBooking/chooseRoom.html',
        () => 'AboutHotelBooking/chooseRoom.html',
        () => '../../FrountEnd/CustomerSection/ChooseROOM/chooseRoom.html',
        () => '../../FrountEnd/CustomerDashBoard/AboutHotelBooking/chooseRoom.html',
        () => '../CustomerSection/ChooseROOM/chooseRoom.html',
        () => 'FrountEnd/CustomerDashBoard/AboutHotelBooking/chooseRoom.html',
        () => 'ChooseROOM/chooseRoom.html',
        () => './chooseRoom.html'
    ];

    window.__CHOOSE_ROOM_RESOLVED_URL = window.__CHOOSE_ROOM_RESOLVED_URL || null;

    // ---------- Utilities: waiting for scripts/globals ----------
    function wait(ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Wait for an externally loaded script element(s) to finish (load or error)
    function waitForAppendedScripts(scripts) {
        return Promise.all(scripts.map(s => {
            return new Promise(resolve => {
                if (!s || !s.src) return resolve(true);
                if (s.dataset && s.dataset.__loaded === '1') return resolve(true);
                const onFinish = () => {
                    try { s.dataset.__loaded = '1'; } catch (e) {}
                    resolve(true);
                };
                s.addEventListener('load', onFinish, { once: true });
                s.addEventListener('error', onFinish, { once: true });
                // in case script already fired synchronously
                if (s.readyState && /loaded|complete/.test(s.readyState)) onFinish();
            });
        }));
    }

    // Wait for a global function name to appear (polling)
    function waitForGlobal(fnName, timeout = 3000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            (function check() {
                if (typeof window[fnName] === 'function') return resolve(true);
                if (Date.now() - start > timeout) return reject(new Error('Timeout waiting for ' + fnName));
                setTimeout(check, 50);
            })();
        });
    }

    // ---------- loadHtmlIntoContainer (Fetch + inject CSS + inline styles + scripts, wait for external scripts) ----------
    // url: absolute or relative url to HTML file
    // container: DOM element to inject into
    async function loadHtmlIntoContainer(url, container) {
        try {
            const absoluteUrl = new URL(url, window.location.href).href;
            const res = await fetch(absoluteUrl, { cache: 'no-store' });
            if (!res.ok) throw new Error(`Failed to load ${absoluteUrl}: ${res.status}`);
            const html = await res.text();

            // parse
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // inject stylesheets (dedupe by absolute href)
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                try {
                    const href = new URL(link.getAttribute('href'), absoluteUrl).href;
                    if (!document.querySelector(`link[href="${href}"]`)) {
                        const newLink = document.createElement('link');
                        newLink.rel = 'stylesheet';
                        newLink.href = href;
                        document.head.appendChild(newLink);
                    }
                } catch (e) {
                    // ignore malformed href
                    console.debug('loadHtmlIntoContainer: skip stylesheet', e);
                }
            });

            // inject inline style blocks (dedupe by text)
            doc.querySelectorAll('style').forEach(style => {
                const exists = Array.from(document.head.querySelectorAll('style')).some(s => s.textContent.trim() === style.textContent.trim());
                if (!exists) document.head.appendChild(style.cloneNode(true));
            });

            // Replace container content with body HTML
            container.innerHTML = doc.body.innerHTML;

            // Execute / append scripts while avoiding duplicates:
            // - If external script src not present, append inline code as script
            // - For external scripts, append to body and record appended nodes to await them
            if (!window.__EXECUTED_INLINE_SCRIPTS) window.__EXECUTED_INLINE_SCRIPTS = new Set();

            // Very simple inline dedupe key: first N chars (cheap)
            function inlineKey(code) {
                return (code || '').trim().slice(0, 200);
            }

            const appendedExternalScripts = [];

            const scripts = Array.from(doc.querySelectorAll('script'));
            for (const s of scripts) {
                try {
                    if (s.src) {
                        // resolve absolute src
                        const src = new URL(s.getAttribute('src'), absoluteUrl).href;
                        // skip if already present on page
                        if (!document.querySelector(`script[src="${src}"]`)) {
                            const newScript = document.createElement('script');
                            newScript.src = src;
                            newScript.async = false;
                            if (s.type) newScript.type = s.type;
                            // append to body so it executes
                            document.body.appendChild(newScript);
                            appendedExternalScripts.push(newScript);
                            // small tick to allow the browser to start fetching
                            await wait(0);
                        } else {
                            // script present - skip
                            console.debug('loadHtmlIntoContainer: skipping existing script', src);
                        }
                    } else {
                        // inline script - dedupe by key
                        const code = s.textContent || '';
                        const key = inlineKey(code);
                        if (!window.__EXECUTED_INLINE_SCRIPTS.has(key)) {
                            const newScript = document.createElement('script');
                            if (s.type) newScript.type = s.type;
                            newScript.textContent = code;
                            document.body.appendChild(newScript);
                            window.__EXECUTED_INLINE_SCRIPTS.add(key);
                        } else {
                            console.debug('loadHtmlIntoContainer: skipping duplicate inline script (key)', key);
                        }
                    }
                } catch (err) {
                    console.warn('loadHtmlIntoContainer script injection error:', err);
                }
            }

            // Wait for appended external scripts to finish loading
            if (appendedExternalScripts.length) {
                try {
                    await waitForAppendedScripts(appendedExternalScripts);
                } catch (e) {
                    console.warn('loadHtmlIntoContainer: appended scripts load warning', e);
                }
            }

            // done
            return true;
        } catch (err) {
            console.error('loadHtmlIntoContainer error:', err);
            throw err;
        }
    }

    // Expose globally so other code can call it as well (your page uses it)
    window.loadHtmlIntoContainer = loadHtmlIntoContainer;

    // ---------- chooseRoom URL resolver (probes candidates) ----------
    async function resolveChooseRoomUrl(hotelId) {
        if (window.__CHOOSE_ROOM_RESOLVED_URL) {
            return window.__CHOOSE_ROOM_RESOLVED_URL + (hotelId ? '?id=' + encodeURIComponent(hotelId) : '');
        }

        for (const candFn of CHOOSE_ROOM_CANDIDATES) {
            try {
                const candidate = (typeof candFn === 'function') ? candFn() : candFn;
                if (!candidate) continue;
                const baseUrl = new URL(candidate, window.location.href).href.split('?')[0];
                try {
                    const res = await fetch(baseUrl, { method: 'GET', cache: 'no-store' });
                    if (res.ok) {
                        window.__CHOOSE_ROOM_RESOLVED_URL = baseUrl;
                        console.debug('resolveChooseRoomUrl -> resolved:', baseUrl);
                        return baseUrl + (hotelId ? '?id=' + encodeURIComponent(hotelId) : '');
                    } else {
                        console.debug('resolveChooseRoomUrl GET returned', res.status, baseUrl);
                    }
                } catch (e) {
                    console.debug('resolveChooseRoomUrl GET failed for', baseUrl, e);
                }
            } catch (err) {
                console.debug('resolveChooseRoomUrl candidate skipped', err);
            }
        }

        console.error('resolveChooseRoomUrl: no chooseRoom.html found (tried candidates).');
        return null;
    }

    // ---------- UI init helpers (light versions) ----------
    function initializeFavorites() {
        document.querySelectorAll('.favorite-btn').forEach(btn => {
            if (!btn.__favAttached) {
                btn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    this.classList.toggle('active');
                    this.style.color = this.classList.contains('active') ? '#e74c3c' : '#666';
                });
                btn.__favAttached = true;
            }
        });
    }
    function initializeTabSwitching() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if (!btn.__tabAttached) {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
                btn.__tabAttached = true;
            }
        });
    }
    function initializeExploreDestinations() { /* noop - keep structure */ }
    function initializeTripPlanner() { /* noop - keep structure */ }
    function initializeSearchFunctionality() { /* noop - keep structure */ }
    function initializeCategoryButtons() { /* noop - keep structure */ }
    function initializeDestinationClicks() { /* noop - keep structure */ }
    function initializeInputEffects() { /* noop - keep structure */ }

    // expose some in case external code wants them
    window.initializeFavorites = initializeFavorites;
    window.initializeTabSwitching = initializeTabSwitching;

    // ---------- show global page error ----------
    function showPageError(message) {
        let el = document.getElementById('global-error-banner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'global-error-banner';
            el.style.background = '#ffe6e6';
            el.style.border = '1px solid #ffb3b3';
            el.style.padding = '12px';
            el.style.margin = '12px';
            el.style.color = '#800';
            el.style.fontWeight = '600';
            document.body.prepend(el);
        }
        el.textContent = message;
    }

    // ---------- load hotels from backend and render cards ----------
    async function loadHotels() {
        try {
            const token = localStorage.getItem('accessToken');
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = 'Bearer ' + token;

            const response = await fetch('http://localhost:8080/api/hotels', { headers });
            if (!response.ok) {
                console.error('HTTP Error loading hotels:', response.status, await response.text());
                showPageError('Unable to load hotels from server.');
                return;
            }
            const result = await response.json();
            const hotels = result.data ? result.data : (Array.isArray(result) ? result : (result.hotels || []));
            renderHotelCards(hotels);
        } catch (err) {
            console.error('Error in loadHotels()', err);
            showPageError('Network error while loading hotels.');
        }
    }

    function escapeHtml(s) {
        if (!s) return '';
        return String(s).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
    }

    function getDefaultImageForHotel(index) {
        const fallbacks = [
            'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&h=600&fit=crop',
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&h=600&fit=crop'
        ];
        return fallbacks[index % fallbacks.length];
    }

    function ensurePropertiesContainerExists() {
        let existing =
            document.getElementById('propertiesContainer') ||
            document.getElementById('properties-container') ||
            document.querySelector('.properties-container') ||
            document.getElementById('properties');

        if (!existing) {
            const main = document.querySelector('main') || document.getElementById('main-content-area') || document.body;
            const fallback = document.createElement('div');
            fallback.id = 'propertiesContainer';
            fallback.className = 'properties-container';
            fallback.style.minHeight = '20px';
            if (main.firstChild) main.insertBefore(fallback, main.firstChild);
            else main.appendChild(fallback);
            existing = fallback;
        }
        return existing;
    }

    function renderHotelCards(hotels) {
        const container = ensurePropertiesContainerExists();
        container.innerHTML = '';

        hotels.forEach((hotel, index) => {
            const card = document.createElement('div');
            card.className = 'property-card';
            const backendImage = (hotel.images && hotel.images.length) ? (hotel.images[0].imageUrl || hotel.images[0] || null) : null;
            const fallback = getDefaultImageForHotel(index);

            card.innerHTML = `
        <div class="property-image-container">
          <img src="${escapeHtml(backendImage || fallback)}" alt="${escapeHtml(hotel.name || 'Property')}" class="property-image"
               onerror="this.onerror=null;this.src='${fallback}';">
          <button class="favorite-btn" title="Favorite">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
        </div>
        <div class="property-info">
          <div class="property-name">${escapeHtml(hotel.name || 'Unknown')}</div>
          <div class="property-location">${escapeHtml(hotel.city || hotel.location || '')}</div>
          <div class="property-price">from $${hotel.pricePerNight || hotel.startingPrice || 'N/A'}</div>
        </div>
      `;

            // click: load chooseRoom with this hotel's details
            card.addEventListener('click', async (e) => {
                e.preventDefault();
                const id = hotel.id || hotel.hotelId || hotel._id;
                if (!id) {
                    console.error('Clicked hotel has no id:', hotel);
                    showPageError('Unable to open hotel details (no id).');
                    return;
                }

                // Write the full hotel object to sessionStorage to avoid additional backend fetch and to avoid race conditions.
                try {
                    const converted = convertBackendHotelData(hotel);
                    sessionStorage.setItem('selectedHotel', JSON.stringify(converted));
                    // Also keep selectedHotelId for compatibility
                    sessionStorage.setItem('selectedHotelId', String(converted.id));
                } catch (err) {
                    console.warn('Could not store selectedHotel in sessionStorage', err);
                }

                // Resolve chooseRoom URL
                const resolved = await resolveChooseRoomUrl(id);
                if (!resolved) {
                    const tried = CHOOSE_ROOM_CANDIDATES.map(fn => (typeof fn === 'function' ? (fn() || '') : fn)).join(', ');
                    const msg = `Could not find chooseRoom.html. Tried candidate paths: ${tried}. Set CHOOSE_ROOM_OVERRIDE if needed.`;
                    console.error(msg);
                    showPageError(msg);
                    return;
                }

                // Determine where to inject the chooseRoom content
                const containerElement = document.getElementById('choose-room-content-area') ||
                    document.getElementById('bookings-page') ||
                    document.getElementById('main-content-area') ||
                    document.querySelector('main') ||
                    document.body;

                try {
                    await loadHtmlIntoContainer(resolved, containerElement);

                    // Wait for chooseRoom initializer to appear (chooseRoom.js should define initializeChooseRoomPage)
                    try {
                        await waitForGlobal('initializeChooseRoomPage', 2500);
                    } catch (err) {
                        // Not fatal. We'll try calling if exists
                        console.warn('initializeChooseRoomPage not found in 2.5s (continuing):', err);
                    }

                    // call initializer if present
                    if (typeof window.initializeChooseRoomPage === 'function') {
                        try {
                            window.initializeChooseRoomPage();
                        } catch (err) {
                            console.warn('initializeChooseRoomPage() threw error:', err);
                        }
                    } else {
                        console.debug('initializeChooseRoomPage not defined after injection - navigating directly instead');
                        // fallback: navigate to resolved URL
                        window.location.href = resolved;
                        return;
                    }

                    // push friendly history (optional)
                    try {
                        const friendlyUrl = window.location.pathname + '?view=chooseRoom&id=' + encodeURIComponent(id);
                        history.pushState({ view: 'chooseRoom', id }, '', friendlyUrl);
                    } catch (e) { /* ignore pushState errors */ }

                } catch (err) {
                    console.error('Failed to load choose room via loader, navigating direct:', err);
                    window.location.href = resolved;
                }
            });

            container.appendChild(card);
        });

        // Attach favorites handlers and other initializers
        initializeFavorites();
        initializeTabSwitching();
    }

    // convert backend DTO shape to the shape used by chooseRoom script (simple mapping)
    function convertBackendHotelData(hotel) {
        return {
            id: hotel.id || hotel.hotelId || hotel._id,
            name: hotel.name || hotel.title || 'Unknown Hotel',
            address: hotel.address || hotel.location || '',
            city: hotel.city || '',
            location: hotel.location || hotel.address || '',
            description: hotel.description || hotel.about || '',
            propertyType: hotel.propertyType || 'Hotel',
            status: hotel.status,
            contactNumber: hotel.contactNumber || hotel.phone || '',
            pricePerNight: hotel.startingPrice || hotel.pricePerNight || 262,
            totalPrice: hotel.totalPrice || (hotel.startingPrice || 262) * 4 * 2,
            nights: hotel.nights || 4,
            rooms: hotel.rooms || 2,
            starRating: hotel.starRating || hotel.rating || 4,
            rating: hotel.averageRating || hotel.rating || 9.1,
            reviews: hotel.reviewsCount || hotel.reviews || 14,
            images: (Array.isArray(hotel.images) && hotel.images.length) ? hotel.images.map(i => (i.imageUrl || i.url || i)) : (hotel.gallery || []),
            roomTypes: hotel.roomTypes || hotel.roomsList || hotel.rooms || [],
            amenities: hotel.amenities ? hotel.amenities.map(a => (a.name ? a.name : a)) : (hotel.facilities || []),
            policy: hotel.policy || {},
            _originalData: hotel
        };
    }

    // ---------- On DOMContentLoaded initialize UI and load hotels ----------
    document.addEventListener('DOMContentLoaded', () => {
        // Ensure container exists early
        ensurePropertiesContainerExists();

        // Expose refreshCityHotels and goBackToHotels to be safe with inline onclicks in HTML
        window.refreshCityHotels = function() {
            // simple click simulation for your menu item if present
            const inviteBtn = document.querySelector('.menu-item[data-page="invite-team"]');
            if (inviteBtn) { inviteBtn.click(); return; }
            // fallback: force-load the HotelBooking page into the invite-team container
            const hotelBookingContent = document.getElementById('hotel-booking-content-area');
            if (!hotelBookingContent) return;
            const url = '../../FrountEnd/CustomerSection/AboutHotelBooking/HotelBookingPage.html';
            loadHtmlIntoContainer(url, hotelBookingContent).then(() => {
                if (typeof window.initializeHotelCityPage === 'function') window.initializeHotelCityPage();
            }).catch(e => console.error('refreshCityHotels error', e));
        };

        window.goBackToHotels = function() {
            try { history.back(); } catch (e) {}
        };

        // Initialize lightweight UI helpers (non-critical)
        initializeFavorites();
        initializeTabSwitching();

        // Load hotels
        loadHotels().catch(err => console.error('loadHotels error', err));
    });

    // expose render/hotel loader for manual usage
    window.loadHotels = loadHotels;
    window.renderHotelCards = renderHotelCards;
    window.resolveChooseRoomUrl = resolveChooseRoomUrl;

})();

