// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on Admin Page
    const adminBody = document.querySelector('.admin-body');
    if (!adminBody) return;

    authGuard(['admin']);
    setupHeaderUser();

    // Chart logic (from old script.js lines 1621+)
    initCharts();

    // Admin Tabs Logic
    const views = {
        dashboard: document.getElementById('view-dashboard'),
        workers: document.getElementById('view-workers'),
        payments: document.getElementById('view-payments')
    };

    const links = {
        dashboard: document.querySelectorAll('.menu-item:nth-child(1), .top-link:nth-child(1)'),
        workers: document.querySelectorAll('.menu-item:nth-child(3), .top-link:nth-child(3)'),
        payments: document.querySelectorAll('.menu-item:nth-child(6), .top-link:nth-child(4)')
    };

    function switchView(viewName) {
        Object.values(views).forEach(el => {
            if (el) el.style.display = 'none';
        });

        if (views[viewName]) {
            views[viewName].style.display = 'block';
            if (viewName === 'workers') loadWorkers();
            if (viewName === 'payments') loadPayments();
        }

        document.querySelectorAll('.menu-item, .top-link').forEach(el => el.classList.remove('active'));

        if (viewName === 'dashboard') {
            if (links.dashboard) links.dashboard.forEach(el => el.classList.add('active'));
        } else if (viewName === 'workers') {
            if (links.workers) links.workers.forEach(el => el.classList.add('active'));
        } else if (viewName === 'payments') {
            if (links.payments) links.payments.forEach(el => el.classList.add('active'));
        }
    }

    if (links.dashboard) {
        links.dashboard.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('dashboard');
        }));
    }

    if (links.workers) {
        links.workers.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('workers');
        }));
    }

    if (links.payments) {
        links.payments.forEach(btn => btn.addEventListener('click', (e) => {
            e.preventDefault();
            switchView('payments');
        }));
    }

    // Load Bookings for Dashboard
    const adminBookingsBody = document.getElementById('adminBookingsTableBody');
    if (adminBookingsBody) loadAllBookings(adminBookingsBody);

});

// Payments List Logic
async function loadPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;

    try {
        const res = await fetch('http://localhost:5000/api/bookings/all');
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const bookings = await res.json();

        // Filter bookings that have a paymentScreenshot
        // We can also include completed ones or any status, but primary interest is the screenshot
        const payments = bookings.filter(b => b.paymentScreenshot);

        tbody.innerHTML = '';

        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem;">No payments found.</td></tr>';
            return;
        }

        payments.forEach(booking => {
            const tr = document.createElement('tr');
            const dateStr = new Date(booking.date).toLocaleDateString();

            let statusStyle = '';
            if (booking.status === 'Accepted') statusStyle = 'background: #dcfce7; color: #15803d;';
            else if (booking.status === 'Completed') statusStyle = 'background: #d1fae5; color: #047857;';
            else statusStyle = 'background: #f1f5f9; color: #475569;';

            tr.innerHTML = `
                <td>#${booking.bookingId || 'N/A'}</td>
                <td>${booking.workerName || 'Unknown'}</td>
                <td>${booking.workerId || 'N/A'}</td>
                <td>${dateStr}</td>
                <td><span class="status-badge" style="${statusStyle}">${booking.status}</span></td>
                <td>
                    <button onclick="viewScreenshot('${booking._id}')" style="padding: 4px 10px; border:none; background:#3b82f6; color:white; border-radius:4px; cursor:pointer;">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <!-- Hidden invisible image for reference if needed, or we fetch again/store in memory -->
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Store payments in a global var so viewScreenshot can access data without re-fetching if we want,
        // or just use the booking ID to find it in the 'bookings' array if we made it global.
        // For simplicity, let's attach data to the window or re-fetch.
        // Actually best is to just store this list in a global variable.
        window.currentPaymentsList = payments;

    } catch (err) {
        console.error('Failed to load payments:', err);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 2rem; color:red;">Failed to load data.</td></tr>';
    }
}

window.viewScreenshot = function (id) {
    if (!window.currentPaymentsList) return;
    const booking = window.currentPaymentsList.find(b => b._id === id);
    if (booking && booking.paymentScreenshot) {
        const win = window.open();
        win.document.write('<img src="' + booking.paymentScreenshot + '" style="max-width:100%;">');
    } else {
        alert('Screenshot not found!');
    }
};

// Workers List Logic
async function loadWorkers() {
    const tbody = document.getElementById('workersTableBody');
    if (!tbody) return;

    try {
        const res = await fetch('http://localhost:5000/api/verification');
        const requests = await res.json();

        tbody.innerHTML = '';

        if (requests.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem;">No pending requests</td></tr>';
            return;
        }

        requests.forEach(req => {
            const tr = document.createElement('tr');
            let statusColor = "background:#fff7ed; color:#c2410c;";
            if (req.status === 'Approved') statusColor = "background:#dcfce7; color:#15803d;";
            if (req.status === 'Rejected') statusColor = "background:#fee2e2; color:#b91c1c;";

            let actionBtn = '';
            if (req.status === 'Pending') {
                actionBtn = `
                    <button style="padding: 4px 10px; border:none; background:#22c55e; color:white; border-radius:4px; cursor:pointer; margin-right:5px;" onclick="window.createApproveHandler('${req._id}')">Approve</button>
                    <button style="padding: 4px 10px; border:none; background:#ef4444; color:white; border-radius:4px; cursor:pointer;" onclick="window.createRejectHandler('${req._id}')">Reject</button>
                `;
            } else if (req.status === 'Approved') {
                actionBtn = '<span style="color:#15803d; font-size:0.85rem; font-weight:600;">Approved</span>';
            } else if (req.status === 'Rejected') {
                actionBtn = '<span style="color:#b91c1c; font-size:0.85rem; font-weight:600;">Rejected</span>';
            }

            let profileHTML = '';
            if (req.profilePhotoData) {
                profileHTML = `<img src="${req.profilePhotoData}" alt="${req.name}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;">`;
            } else {
                profileHTML = `<div style="width:36px; height:36px; border-radius:50%; background:#e2e8f0; color:#475569; display:flex; align-items:center; justify-content:center; font-weight:600; font-size:0.9rem;">${req.name.charAt(0).toUpperCase()}</div>`;
            }

            tr.innerHTML = `
                <td style="font-weight: 500;">
                    <div style="display:flex; align-items:center; gap:0.75rem;">
                        ${profileHTML}
                        <span>${req.name}</span>
                    </div>
                </td>
                <td>${req.email}</td>
                <td>${req.mobile}</td>
                <td>${req.city}</td>
                <td><span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-size: 0.85rem;">${req.idType}</span></td>
                <td><span class="status-badge" style="${statusColor}">${req.status}</span></td>
                <td>
                    ${req.certificateData
                    ? `<a href="#" onclick="const win = window.open(); win.document.write('<iframe src=\\'${req.certificateData}\\' frameborder=\\'0\\' style=\\'border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;\\' allowfullscreen></iframe>');" style="color:#2563eb; text-decoration:underline; font-size:0.85rem;"><i class="fas fa-paperclip"></i> ${req.certificate || 'View File'}</a>`
                    : `<span style="font-size:0.85rem; color:#94a3b8;">No File</span>`
                }
                </td>
                <td>${actionBtn}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Failed to load workers:', err);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding: 2rem; color:red;">Failed to load data. Ensure server is running. (API Error)</td></tr>';
    }
}

// Global Handlers
window.createApproveHandler = async function (id) {
    if (!confirm('Are you sure you want to approve this worker?')) return;
    updateWorkerStatus(id, 'Approved');
};

window.createRejectHandler = async function (id) {
    if (!confirm('Are you sure you want to REJECT this worker?')) return;
    updateWorkerStatus(id, 'Rejected');
};

async function updateWorkerStatus(id, status) {
    try {
        const res = await fetch(`http://localhost:5000/api/verification/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: status })
        });
        if (res.ok) {
            alert(`Worker ${status}!`);
            loadWorkers();
        } else {
            const data = await res.json();
            alert(`Failed to update status: ` + (data.msg || 'Unknown error'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function loadAllBookings(tbody) {
    try {
        const res = await fetch('http://localhost:5000/api/bookings/all');
        if (!res.ok) return;
        const bookings = await res.json();

        tbody.innerHTML = '';
        if (bookings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No bookings found.</td></tr>';
            return;
        }

        bookings.slice(0, 10).forEach(booking => {
            const tr = document.createElement('tr');
            const idShort = booking.bookingId || booking._id.substr(-6).toUpperCase();
            let statusStyle = '';
            if (booking.status === 'Pending') statusStyle = 'background: #fff7ed; color: #c2410c;';
            if (booking.status === 'Accepted') statusStyle = 'background: #dcfce7; color: #15803d;';
            if (booking.status === 'Rejected') statusStyle = 'background: #fee2e2; color: #b91c1c;';

            let rejectionInfo = '';
            if (booking.status === 'Rejected' && booking.rejectionReason) {
                rejectionInfo = `<div style="font-size: 0.75rem; color: #ef4444; margin-top: 4px; max-width: 150px;">Reason: ${booking.rejectionReason}</div>`;
            }

            const workerDisplay = booking.workerId && booking.workerName && booking.workerName !== booking.workerId
                ? `${booking.workerId} - ${booking.workerName}`
                : (booking.workerName || booking.workerId || '-');

            tr.innerHTML = `
               <td>#${idShort}</td>
               <td>${booking.clientName}</td>
               <td>${booking.subService} (${booking.service})</td>
               <td>${workerDisplay}</td>
               <td>
                   <span class='status-badge' style='${statusStyle} padding: 4px 10px; border-radius: 4px; font-weight: 500; font-size: 0.85rem;'>${booking.status}</span>
                   ${rejectionInfo}
               </td>
           `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Error loading admin bookings:', err);
    }
}

function initCharts() {
    const ctx1 = document.getElementById('bookingsChart');
    if (ctx1) {
        new Chart(ctx1, {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Bookings',
                    data: [12, 19, 3, 5, 2, 3, 15],
                    borderColor: '#3b82f6',
                    tension: 0.4
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }

    const ctx2 = document.getElementById('revenueChart');
    if (ctx2) {
        new Chart(ctx2, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [1200, 1900, 300, 500, 200, 300, 1500],
                    backgroundColor: '#10b981'
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
}
