function initializeHotelCityPage() {
    // Interactive functionality
    document.querySelectorAll('.date-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.date-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });

    document.querySelectorAll('.filter-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            if (!tag.classList.contains('active')) {
                tag.classList.toggle('selected');
            }
        });
    });

    const viewMapBtn = document.querySelector('.view-map-btn');
    if (viewMapBtn) {
        viewMapBtn.addEventListener('click', () => {
            alert('Opening map view...');
        });
    }
}