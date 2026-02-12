// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const requestsContainer = document.getElementById('requestsContainer');
    if (!requestsContainer) return;

    authGuard(['professional']);
    setupHeaderUser();

    // Update Sidebar info (reused form worker dashboard essentially, but simplified here)
    updateWorkerSidebar();

    loadRequests();

    function updateWorkerSidebar() {
        const name = localStorage.getItem('userName');
        const email = localStorage.getItem('userEmail');
        const profession = localStorage.getItem('userProfession');

        const nameEl = document.getElementById('workerName');
        const emailEl = document.getElementById('workerEmailDisplay');
        const profEl = document.getElementById('workerProfession');

        if (nameEl && name) nameEl.textContent = name;
        if (emailEl && email) emailEl.textContent = email;
        if (profEl && profession) profEl.textContent = profession;
    }

    async function loadRequests() {
        const workerId = localStorage.getItem('workerId');
        if (!workerId) {
            requestsContainer.innerHTML = '<p class="error-text">Worker ID not found. Please relogin.</p>';
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/bookings/worker/' + workerId);
            if (!res.ok) throw new Error('Failed to fetch requests');

            const bookings = await res.json();

            requestsContainer.innerHTML = '';

            if (bookings.length === 0) {
                requestsContainer.innerHTML = '<p class="loading-text">No new requests at the moment.</p>';
                return;
            }

            bookings.forEach(booking => {
                const card = document.createElement('div');
                card.className = 'request-card';

                const dateObj = new Date(booking.date);
                const dateStr = dateObj.toLocaleDateString();

                let statusBadgeClass = 'status-badge-blue';
                let statusBoxClass = 'status-box-blue';
                if (booking.status === 'Accepted') {
                    statusBadgeClass = 'status-badge-green';
                    statusBoxClass = 'status-box-green';
                }
                if (booking.status === 'Rejected') {
                    statusBadgeClass = 'status-badge-red';
                    statusBoxClass = 'status-box-red';
                }

                let actionButtons = '';
                if (booking.status === 'Pending') {
                    actionButtons = `
                        <div class="action-buttons-container">
                            <button onclick="window.openAcceptModal('${booking._id}')" class="btn-accept">Accept</button>
                            <button onclick="window.updateBookingStatus('${booking._id}', 'Rejected')" class="btn-reject">Reject</button>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div class="status-display-box ${statusBoxClass}">
                            ${booking.status}
                        </div>
                     `;
                }

                let clientDetailsHTML = '';
                if (booking.status === 'Accepted') {
                    clientDetailsHTML = `
                        <p class="client-detail-row"><i class="fas fa-user client-detail-icon"></i> ${booking.clientName}</p>
                        <p class="client-detail-row client-detail-row-space"><i class="fas fa-envelope client-detail-icon"></i> ${booking.clientEmail}</p>
                        ${booking.contact ? `<p class="client-detail-row client-detail-row-space"><i class="fas fa-phone client-detail-icon"></i> ${booking.contact}</p>` : ''}
                        <p class="client-detail-row client-detail-row-space"><i class="fas fa-map-marker-alt client-detail-icon"></i> ${booking.location.houseNo}, ${booking.location.street}</p>
                    `;
                } else {
                    clientDetailsHTML = `
                        <p class="client-detail-row"><i class="fas fa-user client-detail-icon"></i> ${booking.clientName}</p>
                        <p class="client-detail-row hidden-loc client-detail-row-space">Location details hidden until accepted</p>
                    `;
                }

                card.innerHTML = `
                    <div class="request-card-header">
                        <div>
                            <h3 class="request-subservice">${booking.subService}</h3>
                            <p class="request-service-id">${booking.bookingId ? `ID: ${booking.bookingId} • ` : ''}${booking.service}</p>
                        </div>
                        <span class="request-status-badge ${statusBadgeClass}">${booking.status}</span>
                    </div>

                    <div class="request-card-grid">
                        <div>
                            <p class="request-grid-item-label">Date & Time</p>
                            <p class="request-grid-item-value">${dateStr} @ ${booking.time}</p>
                        </div>
                        <div>
                            <p class="request-grid-item-label">Location</p>
                            <p class="request-grid-item-value">${booking.location.city} (${booking.location.type})</p>
                        </div>
                    </div>

                    <div class="client-details-box">
                         <p class="client-details-title">Client Details</p>
                         ${clientDetailsHTML}
                    </div>

                    ${actionButtons}
                `;

                requestsContainer.appendChild(card);
            });

        } catch (err) {
            console.error(err);
            requestsContainer.innerHTML = '<p class="error-text">Error loading requests.</p>';
        }
    }

    window.updateBookingStatus = async function (id, status, extraData = {}) {
        let rejectionReason = null;

        if (status === 'Rejected') {
            rejectionReason = prompt("Please provide a reason for rejecting this request:");
            if (rejectionReason === null) return; // Cancelled
            if (rejectionReason.trim() === "") {
                alert("Rejection reason is required.");
                return;
            }
        } else if (status === 'Accepted') {
            // Confirmation handled by Modal
        } else {
            if (!confirm('Are you sure you want to ' + status + ' this request?')) return;
        }

        try {
            const payload = { status, ...extraData };
            if (rejectionReason) payload.rejectionReason = rejectionReason;

            const res = await fetch('http://localhost:5000/api/bookings/' + id, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Refresh list
                loadRequests();
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            console.error(err);
            alert('Error updating status');
        }
    };

    // --- Accept Modal Logic ---
    let currentAcceptId = null;

    window.openAcceptModal = function (id) {
        currentAcceptId = id;
        const modal = document.getElementById('acceptModal');
        if (modal) modal.style.display = 'block';
    };

    window.closeAcceptModal = function () {
        currentAcceptId = null;
        const modal = document.getElementById('acceptModal');
        if (modal) modal.style.display = 'none';
        // Reset form if needed
        const form = document.getElementById('acceptForm');
        if (form) form.reset();
    };

    const acceptForm = document.getElementById('acceptForm');
    if (acceptForm) {
        acceptForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const fileInput = document.getElementById('paymentScreenshot');
            if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
                alert('Please upload a payment screenshot.');
                return;
            }

            const file = fileInput.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert('File is too large. Max 5MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = function (event) {
                const base64 = event.target.result;
                if (currentAcceptId) {
                    // Send status + screenshot
                    window.updateBookingStatus(currentAcceptId, 'Accepted', { paymentScreenshot: base64 });
                    closeAcceptModal();
                }
            };
            reader.onerror = function () {
                alert('Failed to read file.');
            };
            reader.readAsDataURL(file);
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function (event) {
        const modal = document.getElementById('acceptModal');
        if (event.target == modal) {
            closeAcceptModal();
        }
    });
});
