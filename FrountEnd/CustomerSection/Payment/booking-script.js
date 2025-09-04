// Booking.com Hotel Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all functionality
    initTabNavigation();
    initGallery();
    initRoomBooking();
    initReviews();
    initAmenities();
    initDatePickers();
    initScrollEffects();
    initSearch();
});

// Tab Navigation
function initTabNavigation() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Smooth scroll to relevant section
            const tabText = this.textContent.toLowerCase();
            scrollToSection(tabText);
        });
    });
}

// Gallery Functionality
function initGallery() {
    const seeAllPhotosBtn = document.querySelector('.see-all-photos');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    if (seeAllPhotosBtn) {
        seeAllPhotosBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            openPhotoModal();
        });
    }
    
    // Add click handlers to gallery items
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', function() {
            openPhotoModal(index);
        });
    });
}

// Room Booking Functionality
function initRoomBooking() {
    const bookRoomBtns = document.querySelectorAll('.book-room-btn');
    const chooseRoomBtns = document.querySelectorAll('.choose-room-btn, .choose-room-final');
    
    bookRoomBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const roomCard = this.closest('.room-card');
            const roomType = roomCard.querySelector('h3').textContent;
            bookRoom(roomType);
        });
    });
    
    chooseRoomBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            scrollToSection('rooms');
        });
    });
}

// Reviews Functionality
function initReviews() {
    const showAllReviewsBtns = document.querySelectorAll('.show-all-reviews, .show-verified-reviews');
    
    showAllReviewsBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            loadAllReviews();
        });
    });
    
    // Add interaction to review items
    const reviewItems = document.querySelectorAll('.review-item');
    reviewItems.forEach(item => {
        item.addEventListener('click', function() {
            this.classList.toggle('expanded');
        });
    });
}

// Amenities Functionality
function initAmenities() {
    const showAllAmenitiesBtns = document.querySelectorAll('.show-all-amenities');
    
    showAllAmenitiesBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            toggleAmenities(this);
        });
    });
}

// Date Picker Initialization
function initDatePickers() {
    const dateInputs = document.querySelectorAll('input[type="text"]');
    
    dateInputs.forEach(input => {
        if (input.value.includes('2025')) {
            input.addEventListener('click', function() {
                showDatePicker(this);
            });
        }
    });
}

// Search functionality
function initSearch() {
    const updateSearchBtns = document.querySelectorAll('.update-search-btn');
    
    updateSearchBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            updateSearch();
        });
    });
}

// Scroll Effects
function initScrollEffects() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);
    
    // Observe sections for scroll animations
    const sections = document.querySelectorAll('.left-column section, .right-column section');
    sections.forEach(section => {
        observer.observe(section);
    });
}

// Utility Functions
function scrollToSection(sectionName) {
    let targetElement;
    
    switch(sectionName) {
        case 'rooms':
            targetElement = document.querySelector('.room-options');
            break;
        case 'amenities':
            targetElement = document.querySelector('.amenities-section');
            break;
        case 'reviews':
            targetElement = document.querySelector('.reviews-section');
            break;
        case 'about':
            targetElement = document.querySelector('.hotel-header');
            break;
        case 'photos':
            targetElement = document.querySelector('.hotel-gallery');
            break;
        default:
            targetElement = document.querySelector('.hotel-header');
    }
    
    if (targetElement) {
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function openPhotoModal(startIndex = 0) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'photo-modal';
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-content">
                <button class="close-modal">&times;</button>
                <div class="photo-container">
                    <img src="" alt="Hotel Photo" class="modal-photo">
                    <button class="prev-photo">&#8249;</button>
                    <button class="next-photo">&#8250;</button>
                </div>
                <div class="photo-counter">
                    <span class="current-photo">1</span> / <span class="total-photos">54</span>
                </div>
            </div>
        </div>
    `;
    
    // Add modal styles if not already present
    if (!document.querySelector('#photo-modal-styles')) {
        const modalStyles = document.createElement('style');
        modalStyles.id = 'photo-modal-styles';
        modalStyles.textContent = `
            .photo-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: fadeIn 0.3s ease-out;
            }
            .modal-overlay {
                background: rgba(0,0,0,0.9);
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
            }
            .modal-content {
                position: relative;
                max-width: 90%;
                max-height: 90%;
            }
            .close-modal {
                position: absolute;
                top: -40px;
                right: 0;
                background: none;
                border: none;
                color: white;
                font-size: 30px;
                cursor: pointer;
                z-index: 1001;
                padding: 5px;
            }
            .close-modal:hover {
                opacity: 0.7;
            }
            .photo-container {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-photo {
                max-width: 100%;
                max-height: 80vh;
                object-fit: contain;
                border-radius: 4px;
            }
            .prev-photo, .next-photo {
                position: absolute;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.2);
                border: 1px solid rgba(255,255,255,0.3);
                color: white;
                font-size: 24px;
                padding: 10px 15px;
                cursor: pointer;
                border-radius: 4px;
                transition: background 0.2s;
            }
            .prev-photo:hover, .next-photo:hover {
                background: rgba(255,255,255,0.3);
            }
            .prev-photo {
                left: -60px;
            }
            .next-photo {
                right: -60px;
            }
            .photo-counter {
                text-align: center;
                color: white;
                margin-top: 15px;
                font-size: 14px;
                font-weight: 500;
            }
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @media (max-width: 768px) {
                .prev-photo { left: 10px; }
                .next-photo { right: 10px; }
                .close-modal { top: 10px; right: 10px; }
            }
        `;
        document.head.appendChild(modalStyles);
    }
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
    
    // Modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    const modalPhoto = modal.querySelector('.modal-photo');
    const currentPhotoSpan = modal.querySelector('.current-photo');
    let currentIndex = startIndex;
    
    const photos = [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=800&fit=crop',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&h=800&fit=crop'
    ];
    
    function updatePhoto() {
        const index = currentIndex % photos.length;
        if (index < 0) currentIndex = photos.length - 1;
        modalPhoto.src = photos[Math.abs(currentIndex % photos.length)];
        currentPhotoSpan.textContent = Math.abs(currentIndex % photos.length) + 1;
    }
    
    updatePhoto();
    
    // Event listeners
    closeBtn.addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.className === 'modal-overlay') {
            closeModal();
        }
    });
    
    modal.querySelector('.next-photo').addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex++;
        updatePhoto();
    });
    
    modal.querySelector('.prev-photo').addEventListener('click', (e) => {
        e.stopPropagation();
        currentIndex--;
        updatePhoto();
    });
    
    // Keyboard navigation
    function handleKeyPress(e) {
        switch(e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowRight':
                currentIndex++;
                updatePhoto();
                break;
            case 'ArrowLeft':
                currentIndex--;
                updatePhoto();
                break;
        }
    }
    
    document.addEventListener('keydown', handleKeyPress);
    
    function closeModal() {
        document.body.style.overflow = ''; // Restore scrolling
        document.body.removeChild(modal);
        document.removeEventListener('keydown', handleKeyPress);
    }
}

function bookRoom(roomType) {
    showNotification(`Initiating booking for ${roomType}...`, 'info');
    
    // Simulate booking process
    setTimeout(() => {
        showNotification('Room booking confirmed! Redirecting to payment...', 'success');
        // In a real application, this would redirect to payment page
    }, 2000);
}

function loadAllReviews() {
    const reviewsSection = document.querySelector('.reviews-list');
    const btn = document.querySelector('.show-all-reviews') || document.querySelector('.show-verified-reviews');
    
    if (!btn) return;
    
    // Check if already expanded
    if (btn.textContent.includes('Show Less') || btn.textContent.includes('Hide')) {
        // Hide additional reviews
        const additionalReviews = reviewsSection.querySelectorAll('.review-item.additional');
        additionalReviews.forEach(review => review.remove());
        btn.textContent = btn.textContent.includes('Verified') ? 'Show 14 Verified Reviews' : 'Show All Reviews';
        return;
    }
    
    // Show loading state
    const originalText = btn.textContent;
    btn.textContent = 'Loading reviews...';
    btn.disabled = true;
    
    setTimeout(() => {
        const additionalReviews = `
            <div class="review-item additional">
                <div class="review-header">
                    <span class="review-rating positive">9</span>
                    <div class="review-title-section">
                        <span class="review-title">"Excellent Stay"</span>
                        <span class="review-date">Jan 2025</span>
                    </div>
                </div>
                <p class="review-text">Beautiful property with amazing pool area. Staff was very friendly and helpful. The room was spacious and clean. Would definitely stay here again!</p>
                <div class="reviewer-info">
                    <span class="reviewer-type">Traveling as a Family</span>
                    <span class="reviewer-name">Sarah</span>
                </div>
            </div>
            <div class="review-item additional">
                <div class="review-header">
                    <span class="review-rating positive">8</span>
                    <div class="review-title-section">
                        <span class="review-title">"Great Location"</span>
                        <span class="review-date">Dec 2023</span>
                    </div>
                </div>
                <p class="review-text">Perfect location near the beach. The breakfast was delicious and the pool area is stunning. Only minor issue was the WiFi speed, but overall a great experience.</p>
                <div class="reviewer-info">
                    <span class="reviewer-type">Traveling as a Couple</span>
                    <span class="reviewer-name">Michael</span>
                </div>
            </div>
            <div class="review-item additional">
                <div class="review-header">
                    <span class="review-rating positive">9</span>
                    <div class="review-title-section">
                        <span class="review-title">"Paradise Found"</span>
                        <span class="review-date">Nov 2023</span>
                    </div>
                </div>
                <p class="review-text">This place exceeded our expectations. The villa was pristine, the views were breathtaking, and the service was impeccable. The private pool was a huge plus!</p>
                <div class="reviewer-info">
                    <span class="reviewer-type">Traveling as a Couple</span>
                    <span class="reviewer-name">Emma</span>
                </div>
            </div>
        `;
        
        reviewsSection.insertAdjacentHTML('beforeend', additionalReviews);
        btn.textContent = originalText.includes('Verified') ? 'Show Less Reviews' : 'Hide Additional Reviews';
        btn.disabled = false;
        
        showNotification('All reviews loaded successfully!', 'success');
    }, 1000);
}

function toggleAmenities(btn) {
    const section = btn.closest('section');
    const isExpanded = btn.textContent.includes('Show Less') || btn.textContent.includes('Hide');
    
    if (isExpanded) {
        // Hide additional amenities
        const additionalAmenities = section.querySelectorAll('.amenity-category.additional');
        additionalAmenities.forEach(category => category.remove());
        btn.textContent = 'Show All Amenities';
        return;
    }
    
    btn.textContent = 'Loading...';
    btn.disabled = true;
    
    setTimeout(() => {
        const additionalAmenities = `
            <div class="amenity-category additional">
                <h3>Food & Drinks 🍽️</h3>
                <ul>
                    <li>Bar</li>
                    <li>Wine/Champagne</li>
                    <li>Packed lunches</li>
                    <li>Coffee shop on site</li>
                    <li>Special diet meals available</li>
                </ul>
            </div>
            <div class="amenity-category additional">
                <h3>Business Facilities 💼</h3>
                <ul>
                    <li>Meeting rooms</li>
                    <li>Business center</li>
                    <li>Fax/Photocopying</li>
                    <li>Conference facilities</li>
                </ul>
            </div>
            <div class="amenity-category additional">
                <h3>Entertainment 🎯</h3>
                <ul>
                    <li>Live music performances</li>
                    <li>Game room</li>
                    <li>Library</li>
                    <li>Water sports equipment</li>
                </ul>
            </div>
            <div class="amenity-category additional">
                <h3>Wellness 🧘</h3>
                <ul>
                    <li>Fitness center</li>
                    <li>Yoga classes</li>
                    <li>Massage services</li>
                    <li>Hot tub/Jacuzzi</li>
                </ul>
            </div>
        `;
        
        const amenitiesGrid = section.querySelector('.amenities-grid');
        if (amenitiesGrid) {
            amenitiesGrid.insertAdjacentHTML('beforeend', additionalAmenities);
        }
        
        btn.textContent = 'Show Less Amenities';
        btn.disabled = false;
    }, 800);
}

function showDatePicker(input) {
    showNotification('Date picker functionality would be integrated here in a production environment', 'info');
    
    // Simulate date selection
    setTimeout(() => {
        const startDate = new Date('2025-08-07');
        const endDate = new Date('2025-08-16');
        const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        input.value = `${startDate.toLocaleDateString('en-US')} - ${endDate.toLocaleDateString('en-US')} (${nights} nights)`;
        updatePricing();
    }, 1500);
}

function updateSearch() {
    showNotification('Updating search results...', 'info');
    
    // Simulate search update with loading animation
    const updateBtns = document.querySelectorAll('.update-search-btn');
    updateBtns.forEach(btn => {
        btn.textContent = 'Searching...';
        btn.disabled = true;
    });
    
    setTimeout(() => {
        updateBtns.forEach(btn => {
            btn.textContent = 'Update Search';
            btn.disabled = false;
        });
        showNotification('Search updated! New rates and availability found.', 'success');
        
        // Simulate price changes
        updatePricing();
    }, 2000);
}

function updatePricing() {
    // Simulate dynamic pricing updates
    const priceElements = document.querySelectorAll('.total-price, .total-room-price, .final-price');
    priceElements.forEach(element => {
        const currentPrice = parseInt(element.textContent.replace(/[^0-9]/g, ''));
        const newPrice = currentPrice + Math.floor(Math.random() * 200) - 100; // Random price variation
        element.textContent = `${newPrice.toLocaleString()}`;
    });
}

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add notification styles if not already present
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 80px;
                right: 20px;
                padding: 12px 16px;
                border-radius: 4px;
                color: white;
                font-weight: 500;
                font-size: 14px;
                z-index: 1000;
                animation: slideInRight 0.3s ease-out;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                max-width: 350px;
            }
            .notification-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
                opacity: 0.8;
            }
            .notification-close:hover {
                opacity: 1;
            }
            .notification-success {
                background: #4caf50;
                border-left: 4px solid #2e7d32;
            }
            .notification-info {
                background: #0071c2;
                border-left: 4px solid #005999;
            }
            .notification-error {
                background: #d32f2f;
                border-left: 4px solid #b71c1c;
            }
            .notification-warning {
                background: #ff9800;
                border-left: 4px solid #f57c00;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(100%);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        removeNotification(notification);
    });
    
    // Auto-remove after 4 seconds
    setTimeout(() => {
        if (document.body.contains(notification)) {
            removeNotification(notification);
        }
    }, 4000);
}

function removeNotification(notification) {
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 300);
}

// Add smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Add loading states for interactive elements
document.addEventListener('click', function(e) {
    if (e.target.matches('button') && !e.target.disabled) {
        const originalText = e.target.textContent;
        const button = e.target;
        
        // Add ripple effect
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        button.appendChild(ripple);
        
        setTimeout(() => {
            if (button.contains(ripple)) {
                button.removeChild(ripple);
            }
        }, 600);
    }
});

// Add fade-in animation styles
const fadeInStyles = document.createElement('style');
fadeInStyles.textContent = `
    .fade-in {
        animation: fadeInUp 0.6s ease-out forwards;
    }
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
    }
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
`;
document.head.appendChild(fadeInStyles);

// Initialize tooltips for amenity icons
function initTooltips() {
    const amenityItems = document.querySelectorAll('.amenity-item');
    
    amenityItems.forEach(item => {
        item.addEventListener('mouseenter', function(e) {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = 'Available amenity';
            tooltip.style.cssText = `
                position: absolute;
                background: #333;
                color: white;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 12px;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.2s;
            `;
            
            document.body.appendChild(tooltip);
            
            const rect = item.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - 30) + 'px';
            tooltip.style.opacity = '1';
            
            item.addEventListener('mouseleave', function() {
                if (document.body.contains(tooltip)) {
                    document.body.removeChild(tooltip);
                }
            });
        });
    });
}

// Initialize tooltips when DOM is ready
setTimeout(initTooltips, 100);

// Add print functionality
function initPrintFunction() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            window.print();
        }
    });
}

initPrintFunction();

console.log('Booking.com Hotel Page initialized successfully!');