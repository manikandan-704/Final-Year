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
            requestsContainer.innerHTML = '<p style="color:red; text-align:center;">Worker ID not found. Please relogin.</p>';
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/api/bookings/worker/' + workerId);
            if (!res.ok) throw new Error('Failed to fetch requests');

            const bookings = await res.json();

            requestsContainer.innerHTML = '';

            if (bookings.length === 0) {
                requestsContainer.innerHTML = '<p style="color:#64748b; text-align:center;">No new requests at the moment.</p>';
                return;
            }

            bookings.forEach(booking => {
                const card = document.createElement('div');
                card.style.cssText = 'border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; background: #f8fafc; display: flex; flex-direction: column; gap: 1rem;';

                const dateObj = new Date(booking.date);
                const dateStr = dateObj.toLocaleDateString();

                let statusColor = '#3b82f6'; // blue
                if (booking.status === 'Accepted') statusColor = '#22c55e';
                if (booking.status === 'Rejected') statusColor = '#ef4444';

                let actionButtons = '';
                if (booking.status === 'Pending') {
                    actionButtons = `
                        <div style="display:flex; gap:1rem; margin-top:0.5rem;">
                            <button onclick="window.openAcceptModal('${booking._id}')" style="flex:1; padding:0.75rem; background:#0f172a; color:white; border:none; border-radius:8px; font-weight:600; cursor:pointer;">Accept</button>
                            <button onclick="window.updateBookingStatus('${booking._id}', 'Rejected')" style="flex:1; padding:0.75rem; background:white; color:#ef4444; border:1px solid #ef4444; border-radius:8px; font-weight:600; cursor:pointer;">Reject</button>
                        </div>
                    `;
                } else {
                    actionButtons = `
                        <div style="margin-top:0.5rem; font-weight:600; color:${statusColor}; text-align:center; padding:0.5rem; background:white; border-radius:8px; border:1px solid ${statusColor};">
                            ${booking.status}
                        </div>
                     `;
                }

                let clientDetailsHTML = '';
                if (booking.status === 'Accepted') {
                    clientDetailsHTML = `
                        <p style="margin:0; font-size:0.9rem; color:#475569;"><i class="fas fa-user" style="width:20px;"></i> ${booking.clientName}</p>
                        <p style="margin:0.25rem 0 0 0; font-size:0.9rem; color:#475569;"><i class="fas fa-envelope" style="width:20px;"></i> ${booking.clientEmail}</p>
                        ${booking.contact ? `<p style="margin:0.25rem 0 0 0; font-size:0.9rem; color:#475569;"><i class="fas fa-phone" style="width:20px;"></i> ${booking.contact}</p>` : ''}
                        <p style="margin:0.25rem 0 0 0; font-size:0.9rem; color:#475569;"><i class="fas fa-map-marker-alt" style="width:20px;"></i> ${booking.location.houseNo}, ${booking.location.street}</p>
                    `;
                } else {
                    clientDetailsHTML = `
                        <p style="margin:0; font-size:0.9rem; color:#475569;"><i class="fas fa-user" style="width:20px;"></i> ${booking.clientName}</p>
                        <p style="margin:0.25rem 0 0 0; font-size:0.9rem; color:#94a3b8; font-style:italic;">Location details hidden until accepted</p>
                    `;
                }

                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:start;">
                        <div>
                            <h3 style="margin:0; font-size:1.1rem; font-weight:700; color:#1e293b;">${booking.subService}</h3>
                            <p style="margin:0; font-size:0.9rem; color:#64748b;">${booking.bookingId ? `ID: ${booking.bookingId} • ` : ''}${booking.service}</p>
                        </div>
                        <span style="font-size:0.8rem; padding:0.25rem 0.5rem; background:${statusColor}20; color:${statusColor}; border-radius:4px; font-weight:600;">${booking.status}</span>
                    </div>

                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; font-size:0.9rem;">
                        <div>
                            <p style="margin:0; color:#64748b; font-size:0.8rem;">Date & Time</p>
                            <p style="margin:0; font-weight:500; color:#334155;">${dateStr} @ ${booking.time}</p>
                        </div>
                        <div>
                            <p style="margin:0; color:#64748b; font-size:0.8rem;">Location</p>
                            <p style="margin:0; font-weight:500; color:#334155;">${booking.location.city} (${booking.location.type})</p>
                        </div>
                    </div>

                    <div style="background:white; padding:1rem; border-radius:8px; border:1px solid #e2e8f0;">
                         <p style="margin:0 0 0.5rem 0; font-weight:600; color:#1e293b; font-size:0.95rem;">Client Details</p>
                         ${clientDetailsHTML}
                    </div>

                    ${actionButtons}
                `;

                requestsContainer.appendChild(card);
            });

        } catch (err) {
            console.error(err);
            requestsContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading requests.</p>';
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
