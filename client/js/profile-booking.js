// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const workersGrid = document.getElementById('workersGrid');
    if (!workersGrid) return;

    authGuard(['client']);
    setupHeaderUser();

    // Get Service from URL
    const urlParams = new URLSearchParams(window.location.search);
    const service = urlParams.get('service') || 'General';

    // Update Title
    const titleEl = document.getElementById('serviceTitle');
    if (titleEl) titleEl.textContent = `Best ${service} Experts`;

    // Unique Image Mapping
    const expertImages = {
        'Plumbing': 'https://images.unsplash.com/photo-1581244276891-8907865e305d?auto=format&fit=crop&q=80&w=1400',
        'Electrical': 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1400',
        'Cleaning': 'https://images.unsplash.com/photo-1581578731548-c64695cc6958?auto=format&fit=crop&q=80&w=1400',
        'Painting': 'https://images.unsplash.com/photo-1589939705384-5185138a04b9?auto=format&fit=crop&q=80&w=1400',
        'Carpentry': 'https://images.unsplash.com/photo-1601058268499-e52658b8bb88?auto=format&fit=crop&q=80&w=1400',
        'AC Service': 'https://images.unsplash.com/photo-1599933333931-977cc9b2ba72?auto=format&fit=crop&q=80&w=1400',
        'CCTV': 'https://images.unsplash.com/photo-1557597774-9d2739f05a86?auto=format&fit=crop&q=80&w=1400',
        'CCTV Service': 'https://images.unsplash.com/photo-1557597774-9d2739f05a86?auto=format&fit=crop&q=80&w=1400',
        'Interior': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1400',
        'Interior Design': 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=1400',
        'Civil': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1400',
        'Civil Service': 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&q=80&w=1400',
        'RO': 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?auto=format&fit=crop&q=80&w=1400',
        'RO Purifier': 'https://images.unsplash.com/photo-1595113316349-9fa4eb24f884?auto=format&fit=crop&q=80&w=1400',
        'General': 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=1400'
    };

    const heroImg = document.getElementById('serviceHeroImg');
    if (heroImg) heroImg.src = expertImages[service] || expertImages['General'];

    const cityFilter = document.getElementById('cityFilter');

    // Main Logic
    if (cityFilter) {
        cityFilter.addEventListener('change', () => {
            const selectedCity = cityFilter.value;
            if (selectedCity) {
                fetchWorkers(selectedCity);
            } else {
                workersGrid.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search" style="font-size: 2rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                    <p>Please select your city to see available professionals.</p>
                </div>`;
            }
        });
    }

    async function fetchWorkers(city) {
        workersGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center;">Loading professionals...</p>';

        try {
            const apiUrl = `http://localhost:5000/api/verification?status=Approved&city=${encodeURIComponent(city)}&profession=${encodeURIComponent(service)}`;

            const res = await fetch(apiUrl);
            if (!res.ok) throw new Error(`Status ${res.status}`);

            const workers = await res.json();
            renderWorkers(workers);

        } catch (err) {
            console.error("Fetch Error:", err);
            workersGrid.innerHTML = `<p style="color:red; text-align:center;">Unable to load professionals. ${err.message}</p>`;
        }
    }

    function renderWorkers(workers) {
        if (workers.length === 0) {
            workersGrid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-user-slash" style="font-size: 2rem; margin-bottom: 1rem; color: #cbd5e1;"></i>
                <p>No verified ${service} professionals found in ${cityFilter.value}.</p>
            </div>`;
            return;
        }

        workersGrid.innerHTML = '';
        workers.forEach(worker => {
            const rating = worker.rating !== undefined ? Number(worker.rating).toFixed(1) : '5.0';
            const jobs = worker.jobsCompleted !== undefined ? worker.jobsCompleted : 0;
            const initial = worker.name ? worker.name.charAt(0).toUpperCase() : 'U';

            // Check for profile image
            let imageContent = initial;
            if (worker.profilePhotoData) {
                imageContent = `<img src="${worker.profilePhotoData}" alt="${worker.name}" class="worker-img">`;
            }

            const card = document.createElement('div');
            card.className = 'worker-card';
            card.innerHTML = `
                <div class="worker-img-container">
                   ${imageContent}
                    <div class="verified-badge"><i class="fas fa-check-circle"></i> Verified</div>
                </div>
                <div class="worker-info">
                    <div class="worker-header">
                        <div class="worker-name">${worker.name || 'Professional'}</div>
                        <div class="worker-rating" onclick="window.openReviewsModal('${worker.workerId}', '${worker.name}')" style="cursor: pointer;" title="View Reviews">
                            <i class="fas fa-star"></i> ${rating}
                        </div>
                    </div>
                    <div class="worker-details">
                        <div class="detail-item"><i class="fas fa-briefcase"></i> <span>${worker.profession || service}</span></div>
                        <div class="detail-item"><i class="fas fa-map-marker-alt"></i> <span>${worker.city}</span></div>
                        <div class="detail-item"><i class="fas fa-check-double"></i> <span>${jobs} Jobs Completed</span></div>
                    </div>
                    <button class="book-btn" onclick="window.bookWorker('${worker.workerId}', '${worker.name}', '${worker.mobile}')">
                        Book Now <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            `;
            workersGrid.appendChild(card);
        });
    }

    window.bookWorker = function (id, name, phone) {
        const city = cityFilter ? cityFilter.value : '';
        const targetUrl = `booking-page.html?service=${encodeURIComponent(service)}&workerId=${id}&workerName=${encodeURIComponent(name)}&workerPhone=${encodeURIComponent(phone || '')}&city=${encodeURIComponent(city)}`;
        window.location.href = targetUrl;
    };

    // Review Modal Logic
    const reviewsModal = document.getElementById('reviewsModal');
    const reviewsList = document.getElementById('modalReviewsList');
    const modalWorkerName = document.getElementById('modalWorkerName');

    window.openReviewsModal = async function (workerId, workerName) {
        if (!reviewsModal) return;

        // Prevent bubbling if triggered from card click (though structure prevents it mostly)
        // event.stopPropagation(); 

        reviewsModal.style.display = 'block';
        if (modalWorkerName) modalWorkerName.textContent = `Reviews for ${workerName}`;
        if (reviewsList) reviewsList.innerHTML = '<p class="loading-text" style="text-align:center; padding: 2rem;">Loading reviews...</p>';

        try {
            const res = await fetch(`http://localhost:5000/api/bookings/worker/${workerId}`);
            if (!res.ok) throw new Error('Failed to fetch reviews');

            const bookings = await res.json();
            // Filter bookings that are completed AND have feedback or rating
            const reviews = bookings.filter(b => b.status === 'Completed' && (b.feedback || b.rating));

            renderReviews(reviews);
        } catch (err) {
            console.error(err);
            if (reviewsList) reviewsList.innerHTML = '<p class="error-msg" style="color:red; text-align:center;">Failed to load reviews.</p>';
        }
    };

    window.closeReviewsModal = function () {
        if (reviewsModal) reviewsModal.style.display = 'none';
    };

    function renderReviews(reviews) {
        if (!reviewsList) return;
        reviewsList.innerHTML = '';

        if (reviews.length === 0) {
            reviewsList.innerHTML = '<div class="no-reviews">No reviews yet for this professional.</div>';
            return;
        }

        reviews.forEach(review => {
            const date = new Date(review.createdAt || Date.now()).toLocaleDateString();
            const ratingStars = '★'.repeat(review.rating || 0) + '☆'.repeat(5 - (review.rating || 0));

            const reviewItem = document.createElement('div');
            reviewItem.className = 'review-card';
            reviewItem.innerHTML = `
                <div class="review-header">
                    <span class="reviewer-name">${review.clientName || 'Client'}</span>
                    <span class="review-rating" style="color:#f59e0b;">${ratingStars}</span>
                </div>
                <p class="review-text">${review.feedback || 'No written feedback.'}</p>
                <div class="review-date">${date}</div>
            `;
            reviewsList.appendChild(reviewItem);
        });
    }

    // Close modal when clicking outside
    window.onclick = function (event) {
        if (event.target === reviewsModal) {
            closeReviewsModal();
        }
    };
});
