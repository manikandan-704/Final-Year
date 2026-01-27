// import { setupHeaderUser, authGuard } from './utils.js';

let currentBookingIdToCancel = null;

document.addEventListener('DOMContentLoaded', () => {
    const bookingsList = document.getElementById('bookingsList');
    if (!bookingsList) return;

    authGuard(['client']);
    setupHeaderUser();

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
        loadMyBookings(userEmail);
    }
});

// Setup global modal handlers
window.openCancelModal = function (bookingId) {
    currentBookingIdToCancel = bookingId;
    document.getElementById('cancelModal').classList.add('active');
};

window.closeCancelModal = function () {
    currentBookingIdToCancel = null;
    document.getElementById('cancellationReason').value = '';
    document.getElementById('cancelModal').classList.remove('active');
};

window.confirmCancellation = async function () {
    if (!currentBookingIdToCancel) return;

    const reason = document.getElementById('cancellationReason').value.trim();
    if (!reason) {
        alert('Please provide a reason for cancellation.');
        return;
    }

    try {
        const res = await fetch(`http://localhost:5000/api/bookings/${currentBookingIdToCancel}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'Cancelled',
                cancellationReason: reason
            })
        });

        if (res.ok) {
            alert('Service cancelled successfully.');
            window.closeCancelModal();
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail) loadMyBookings(userEmail);
        } else {
            alert('Failed to cancel service.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred. Please try again.');
    }
};

window.markWorkCompleted = async function (bookingId) {
    if (!confirm('Are you sure you want to mark this work as completed? This will verify that the work has been done satisfyingly.')) return;

    try {
        const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'Completed'
            })
        });

        if (res.ok) {
            alert('Work marked as completed! Notification sent to worker and admin.');
            const userEmail = localStorage.getItem('userEmail');
            if (userEmail) loadMyBookings(userEmail);
        } else {
            alert('Failed to update status.');
        }
    } catch (err) {
        console.error(err);
        alert('An error occurred. Please try again.');
    }
};

async function loadMyBookings(email) {
    const container = document.getElementById('bookingsList');

    try {
        const res = await fetch(`http://localhost:5000/api/bookings/client/${email}`);
        if (!res.ok) throw new Error('Failed to fetch bookings');

        const bookings = await res.json();

        if (bookings.length === 0) {
            container.innerHTML = `
                <div class="no-bookings">
                    <i class="fas fa-calendar-times no-bookings-icon"></i>
                    <h3>No bookings yet</h3>
                    <p>You haven't made any service requests yet.</p>
                    <button onclick="window.location.href='client-page.html'" 
                        class="book-service-btn">
                        Book a Service
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        bookings.forEach(booking => {
            const dateObj = new Date(booking.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });

            let statusClass = 'status-pending';
            let statusIcon = '<i class="fas fa-clock"></i>';
            let statusText = 'Request Pending';

            if (booking.status === 'Accepted') {
                statusClass = 'status-accepted';
                statusIcon = '<i class="fas fa-check-circle"></i>';
                statusText = 'Request Accepted';
            } else if (booking.status === 'Rejected') {
                statusClass = 'status-rejected';
                statusIcon = '<i class="fas fa-times-circle"></i>';
                statusText = 'Request Denied';
            } else if (booking.status === 'Cancelled') {
                statusClass = 'status-rejected';
                statusIcon = '<i class="fas fa-ban"></i>';
                statusText = 'Cancelled by You';
            } else if (booking.status === 'Completed') {
                statusClass = 'status-accepted';
                statusIcon = '<i class="fas fa-check-double"></i>';
                statusText = 'Work Completed';
            }

            const card = document.createElement('div');
            card.className = 'booking-card';

            let rejectionReasonHTML = '';
            if (booking.status === 'Rejected' && booking.rejectionReason) {
                rejectionReasonHTML = `
                    <div class="info-group rejection-group">
                      <label class="rejection-text"><i class="fas fa-exclamation-circle"><span id="rejection-text1"></span></i><span id="rejection-text1">Reason for Rejection</span></label>
                        <p id="rejection-text" class="rejection-text"><span id="rejection-text2">${booking.rejectionReason}</span></p>
                    </div>
                `;
            } else if (booking.status === 'Cancelled' && booking.cancellationReason) {
                rejectionReasonHTML = `
                    <div class="info-group rejection-group">
                        <label class="rejection-text"><i class="fas fa-ban"></i> Reason for Cancellation</label>
                        <p class="rejection-text">${booking.cancellationReason}</p>
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="card-header">
                    <div>
                        <div class="booking-service">${booking.subService}</div>
                        <div class="booking-id">ID: ${booking.bookingId || 'N/A'} • ${booking.service} Category</div>
                    </div>
                    <div class="status-badge ${statusClass}">
                        ${statusIcon} ${statusText}
                    </div>
                </div>
                <div class="card-body">
                    <div class="info-group">
                        <label><i class="far fa-calendar-alt"></i> Date & Time</label>
                        <p>${dateStr} at ${booking.time}</p>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-map-marker-alt"></i> Location</label>
                        <p>${booking.location.city} (${booking.location.type})</p>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-user-hard-hat"></i> Professional</label>
                        <p class="worker-name">
                            ${booking.workerId && booking.workerName && booking.workerName !== booking.workerId
                    ? `${booking.workerId} - ${booking.workerName}`
                    : (booking.workerName || booking.workerId || 'Any Available Professional')}
                        </p>
                    </div>
                    <div class="info-group">
                        <label><i class="fas fa-phone-alt"></i> Contact Number</label>
                        <p>${booking.workerPhone || 'N/A'}</p>
                    </div>
                    ${rejectionReasonHTML}
                    ${booking.status === 'Accepted' ? `
                        <div style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 0.5rem;">
                            <button onclick="window.openCancelModal('${booking._id}')" class="cancel-service-btn">
                                <i class="fas fa-times-circle"></i> Cancel Service
                            </button>
                            <button onclick="window.markWorkCompleted('${booking._id}')" class="complete-service-btn">
                                <i class="fas fa-check"></i> Work Completed
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="error-msg">Failed to load booking history. Please try again later.</p>';
    }
}
