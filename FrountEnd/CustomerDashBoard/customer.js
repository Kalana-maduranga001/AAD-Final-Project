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