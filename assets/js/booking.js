// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    if (!bookingForm) return;

    authGuard(['client']);
    setupHeaderUser();

    // Set Service Category from URL param
    const urlParams = new URLSearchParams(window.location.search);
    const serviceParam = urlParams.get('service');
    const workerIdParam = urlParams.get('workerId');
    const workerNameParam = urlParams.get('workerName');

    if (serviceParam) {
        const selectDiv = document.getElementById('serviceCategory');
        if (selectDiv) selectDiv.value = serviceParam;
    }

    // Sub-Service Character Counter
    const subServiceTextarea = document.getElementById('subService');
    const countDisplay = document.getElementById('subServiceCharCount');
    if (subServiceTextarea && countDisplay) {
        subServiceTextarea.addEventListener('input', () => {
            countDisplay.textContent = subServiceTextarea.value.length;
        });
    }

    // Handle parameters from profile-booking.html
    if (workerIdParam) {
        const hiddenInput = document.getElementById('selectedWorkerId');
        if (hiddenInput) hiddenInput.value = workerIdParam;

        if (workerNameParam) {
            const workerDisplay = document.getElementById('selectedWorkerDisplay');
            if (workerDisplay) {
                workerDisplay.style.display = 'block';
                workerDisplay.innerHTML = `
                    <div style="display:flex; align-items:center; gap:1rem;">
                        <div style="width:50px; height:50px; background:#0f172a; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1.2rem;">
                            ${workerNameParam.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <span style="display:block; font-size:0.85rem; color:#64748b; font-weight:500; margin-bottom:0.25rem;">Selected Professional</span>
                            <h4 style="margin:0; font-size:1.1rem; font-weight:700; color:#1e293b;">${decodeURIComponent(workerNameParam)}</h4>
                        </div>
                        <div style="margin-left:auto; color:#15803d; font-weight:600; font-size:0.9rem; display:flex; align-items:center; gap:0.5rem;">
                            <i class="fas fa-check-circle"></i> Verified
                        </div>
                    </div>
                `;
            }
        }
    }

    // Set Location (District) from URL param
    const cityParam = urlParams.get('city');
    const citySelect = document.getElementById('locCity');
    if (cityParam && citySelect) {
        citySelect.value = cityParam;
    }

    // Worker Selection Logic (if city matches)
    if (citySelect) {
        citySelect.addEventListener('change', (e) => {
            const city = e.target.value;
            const urlWorkerId = new URLSearchParams(window.location.search).get('workerId');
            if (urlWorkerId) return; // Respect exact profile

            if (city) {
                fetchWorkersForCity(city);
            } else {
                const container = document.getElementById('workerListContainer');
                if (container) container.style.display = 'none';
            }
        });
    }

    initCalendar();

    // Attach form handler to global scope
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.onclick = window.handleBooking;
    }
});

// Calendar Globals
const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDateObj = null;

function initCalendar() {
    renderCalendar(currentMonth, currentYear);
}

window.changeMonth = function (direction) {
    currentMonth += direction;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    renderCalendar(currentMonth, currentYear);
};

function renderCalendar(month, year) {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('currentMonthYear');
    if (!grid || !monthLabel) return;

    grid.innerHTML = "";
    monthLabel.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        grid.appendChild(document.createElement('div'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.classList.add('calendar-day');
        dayEl.textContent = day;

        const thisDate = new Date(year, month, day);
        if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayEl.classList.add('today');
        }

        const todayMid = new Date();
        todayMid.setHours(0, 0, 0, 0);
        if (thisDate < todayMid) {
            dayEl.classList.add('disabled');
        } else {
            dayEl.onclick = () => window.selectDate(day, month, year, dayEl);
        }

        if (selectedDateObj &&
            selectedDateObj.getDate() === day &&
            selectedDateObj.getMonth() === month &&
            selectedDateObj.getFullYear() === year) {
            dayEl.classList.add('selected');
        }

        grid.appendChild(dayEl);
    }
}

window.selectDate = function (day, month, year, el) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');

    selectedDateObj = new Date(year, month, day);
    const dayName = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = `${dayName}, ${monthNames[month]} ${day}`;

    const dateLabel = document.getElementById('selectedDateLabel');
    if (dateLabel) dateLabel.textContent = dateStr;

    const fmtMonth = String(month + 1).padStart(2, '0');
    const fmtDay = String(day).padStart(2, '0');
    document.getElementById('selectedDate').value = `${year}-${fmtMonth}-${fmtDay}`;

    document.getElementById('slotsPlaceholder').style.display = 'none';
    document.getElementById('slotsWrapper').style.display = 'flex';

    renderTimeSlots();
};

function renderTimeSlots() {
    const list = document.getElementById('slotsList');
    if (!list) return;
    list.innerHTML = "";
    document.getElementById('selectedTime').value = "";

    const startTime = 9 * 60;
    const endTime = 18 * 60;
    const interval = 30;

    const today = new Date();
    let currentMinutes = -1;

    if (selectedDateObj &&
        selectedDateObj.getDate() === today.getDate() &&
        selectedDateObj.getMonth() === today.getMonth() &&
        selectedDateObj.getFullYear() === today.getFullYear()) {
        currentMinutes = today.getHours() * 60 + today.getMinutes();
    }

    for (let time = startTime; time <= endTime; time += interval) {
        if (currentMinutes !== -1 && time <= currentMinutes) continue;

        const hours = Math.floor(time / 60);
        const minutes = time % 60;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = String(minutes).padStart(2, '0');
        const timeStr = `${displayHours}:${displayMinutes}${ampm}`;

        const container = document.createElement('div');
        container.className = 'time-slot-container';

        const btn = document.createElement('div');
        btn.className = 'time-slot-primary';
        btn.textContent = timeStr;
        btn.onclick = () => window.selectTime(timeStr, btn, container);

        container.appendChild(btn);
        list.appendChild(container);
    }

    if (list.children.length === 0) {
        list.innerHTML = '<p style="text-align:center; color:#64748b; padding:1rem;">No available slots for today.</p>';
    }
}

window.selectTime = function (timeStr, btn, container) {
    document.querySelectorAll('.time-slot-primary').forEach(b => {
        b.classList.remove('selected');
        const parent = b.parentElement;
        if (parent.querySelector('.time-confirm-btn')) {
            parent.querySelector('.time-confirm-btn').remove();
        }
    });

    btn.classList.add('selected');

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'time-confirm-btn';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.type = 'button';
    confirmBtn.onclick = (e) => window.confirmTime(e, timeStr);

    container.appendChild(confirmBtn);
};

window.confirmTime = function (e, timeStr) {
    e.stopPropagation();
    document.getElementById('selectedTime').value = timeStr;

    const allConfirm = document.querySelectorAll('.time-confirm-btn');
    allConfirm.forEach(btn => {
        if (btn.textContent === 'Confirm') {
            btn.textContent = 'Confirmed';
            btn.style.backgroundColor = '#1e293b';
        }
    });
};

window.handleBooking = async function (event) {
    event.preventDefault();

    const dateVal = document.getElementById('selectedDate').value;
    const timeVal = document.getElementById('selectedTime').value;

    if (!dateVal) { alert('Please select a date from the calendar.'); return; }
    if (!timeVal) { alert('Please select and confirm a time slot.'); return; }

    const category = document.getElementById('serviceCategory').value;
    const subService = document.getElementById('subService').value;
    const houseNo = document.getElementById('locHouseNo').value;
    const street = document.getElementById('locStreet').value;
    const city = document.getElementById('locCity').value;
    const pincode = document.getElementById('locPincode').value;
    const locType = document.querySelector('input[name="locType"]:checked').value;
    const selectedWorkerId = document.getElementById('selectedWorkerId').value;

    let selectedWorkerName = null;
    let selectedWorkerPhone = null;
    if (selectedWorkerId) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('workerId') === selectedWorkerId) {
            selectedWorkerName = urlParams.get('workerName');
            selectedWorkerPhone = urlParams.get('workerPhone');
        } else {
            const selectedCard = document.querySelector(`.worker-card[data-id="${selectedWorkerId}"]`);
            if (selectedCard) {
                const nameEl = selectedCard.querySelector('h4');
                if (nameEl) selectedWorkerName = nameEl.textContent;
                selectedWorkerPhone = selectedCard.dataset.phone;
            }
        }
    }
    const contact = document.getElementById('contact').value;

    if (!/^\d{10}$/.test(contact)) {
        alert('Please enter a valid 10-digit contact number.');
        return;
    }

    const clientName = localStorage.getItem('userName') || 'Client';
    const clientEmail = localStorage.getItem('userEmail');

    if (!clientEmail) {
        alert('You must be logged in to book a service.');
        window.location.href = 'index.html';
        return;
    }

    const bookingDetails = {
        clientName,
        clientEmail,
        service: category,
        subService,
        contact,
        date: dateVal,
        time: timeVal,
        location: { houseNo, street, city, pincode, type: locType },
        workerId: selectedWorkerId || null,
        workerName: selectedWorkerName,
        workerPhone: selectedWorkerPhone,
        profession: category,
        status: 'Pending'
    };

    try {
        const res = await fetch('http://localhost:5000/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingDetails)
        });

        if (!res.ok) throw new Error('Booking failed. Server returned ' + res.status);

        const data = await res.json();
        window.showToast('Booking Request Sent Successfully!', 'success');

        setTimeout(() => {
            window.location.href = 'client-page.html';
        }, 2000);

    } catch (err) {
        console.error(err);
        window.showToast('Error creating booking: ' + err.message, 'error');
    }
};

async function fetchWorkersForCity(city) {
    const container = document.getElementById('workerListContainer');
    const list = document.getElementById('workerList');
    if (!container || !list) return;

    const professionSelect = document.getElementById('serviceCategory');
    const profession = professionSelect ? professionSelect.value : '';

    container.style.display = 'block';
    list.innerHTML = '<p style="color:#94a3b8; font-style:italic;">Loading professionals...</p>';

    try {
        const queryParams = new URLSearchParams({
            status: 'Approved',
            city: city,
            profession: profession
        });

        const res = await fetch(`http://localhost:5000/api/verification?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Server returned ' + res.status);

        const workers = await res.json();

        list.innerHTML = '';
        if (workers.length === 0) {
            list.innerHTML = '<p style="color:#ef4444; grid-column: 1/-1;">No verified professionals found in this city yet.</p>';
            return;
        }

        workers.forEach(w => {
            const rating = (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1);
            const reviewCount = Math.floor(Math.random() * 100) + 5;

            const card = document.createElement('div');
            card.className = 'worker-card';
            card.style.cssText = 'border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; background: white; cursor: pointer; transition: all 0.2s; position: relative;';
            card.setAttribute('data-id', w._id);
            card.setAttribute('data-phone', w.mobile || '');
            card.onclick = () => window.selectWorker(w._id, card);

            card.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
                    <div style="width:40px; height:40px; background:#0f172a; color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700;">
                        ${w.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 style="margin:0; font-size:0.95rem; font-weight:600; color:#1e293b;">${w.name}</h4>
                        <span style="font-size:0.8rem; color:#64748b;">Verified <i class="fas fa-check-circle" style="color:#15803d;"></i></span>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem;">
                    <span style="color:#f59e0b; font-weight:700;"><i class="fas fa-star"></i> ${rating} <span style="color:#94a3b8; font-weight:400; font-size:0.8rem;">(${reviewCount})</span></span>
                    <span style="color:#2563eb; font-weight:500;">Select</span>
                </div>
            `;
            list.appendChild(card);
        });

    } catch (err) {
        console.error(err);
        list.innerHTML = '<p style="color:#ef4444;">Failed to load professionals.</p>';
    }
}

window.selectWorker = function (id, cardElement) {
    document.querySelectorAll('.worker-card').forEach(c => {
        c.style.borderColor = '#e2e8f0';
        c.style.backgroundColor = 'white';
        c.style.boxShadow = 'none';
        c.querySelector('span[style*="#2563eb"]').textContent = "Select";
    });

    cardElement.style.borderColor = '#0f172a';
    cardElement.style.backgroundColor = '#f8fafc';
    cardElement.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    cardElement.querySelector('span[style*="#2563eb"]').textContent = "Selected";
    document.getElementById('selectedWorkerId').value = id;
};
