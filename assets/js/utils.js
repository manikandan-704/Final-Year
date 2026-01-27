// Utility Functions

// Capitalize first letter of string
window.capitalize = function (str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
};

// Global Logout Function
window.logout = function () {
    localStorage.clear();
    window.location.href = 'index.html';
};

// Auth Guard - Protects pages based on role
window.authGuard = function (allowedRoles = []) {
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    // If no session, redirect to login
    if (!userEmail) {
        window.location.href = 'login-page.html';
        return null;
    }

    // If role not allowed, redirect to appropriate page
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        if (userRole === 'admin') window.location.href = 'admin-page.html';
        else if (userRole === 'professional') window.location.href = 'worker-page.html';
        else window.location.href = 'client-page.html';
        return null;
    }

    return { userRole, userEmail };
};


// Set user email in header if element exists
window.setupHeaderUser = function () {
    const emailDisplay = document.getElementById('userEmailDisplay');
    if (emailDisplay) {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            emailDisplay.textContent = userEmail;
        }
    }

    // Worker specific email display
    const workerEmailDisplay = document.getElementById('workerEmailDisplay');
    if (workerEmailDisplay) {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) {
            workerEmailDisplay.textContent = userEmail;
        }
    }

    // Header specific for profile page
    const headerEmailDisplay = document.getElementById('headerEmailDisplay');
    if (headerEmailDisplay) {
        const userEmail = localStorage.getItem('userEmail');
        if (userEmail) headerEmailDisplay.textContent = userEmail;
    }

    // Attach logout listener if button exists
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.onclick = window.logout;
    }
};
