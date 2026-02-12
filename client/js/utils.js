
// Toast Notification Utility
window.showToast = function (message, type = 'success') {
    // Implementation of toast (already exists, preserving it)
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);

        // Inject styles dynamically if not already present
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.innerHTML = `
                .toast-container {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .toast {
                    min-width: 250px;
                    padding: 16px;
                    border-radius: 8px;
                    background: white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    animation: slideIn 0.3s ease-out forwards;
                    border-left: 4px solid #3b82f6;
                }
                .toast.success { border-left-color: #22c55e; }
                .toast.error { border-left-color: #ef4444; }
                .toast-icon { font-size: 20px; }
                .toast.success .toast-icon { color: #22c55e; }
                .toast.error .toast-icon { color: #ef4444; }
                .toast-message { font-size: 14px; font-weight: 500; color: #1e293b; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes fadeOut {
                    to { opacity: 0; transform: translateX(100%); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icons based on type
    const icon = type === 'success' ? 'check-circle' : 'exclamation-circle';

    toast.innerHTML = `
        <i class="fas fa-${icon} toast-icon"></i>
        <div class="toast-message">${message}</div>
    `;

    toastContainer.appendChild(toast);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 300);
    }, 3000);
};

// Mobile Menu Toggle
function toggleMobileMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('active');
}

// Helper to set header email for clients/workers
function setupHeaderUser() {
    const email = localStorage.getItem('userEmail');
    if (!email) return;

    // We have different IDs in different files, easiest to try both
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    if (userEmailDisplay) userEmailDisplay.textContent = email;

    const headerEmailDisplay = document.getElementById('headerEmailDisplay');
    if (headerEmailDisplay) headerEmailDisplay.textContent = email;

    const workerEmailDisplay = document.getElementById('workerEmailDisplay');
    if (workerEmailDisplay) workerEmailDisplay.textContent = email;
}

// Attach to window so it's globally available
window.setupHeaderUser = setupHeaderUser;

// Auth Guard check
function authGuard(allowedRoles = []) {
    const token = localStorage.getItem('userEmail'); // Simple check, ideally token
    const role = localStorage.getItem('userRole');

    if (!token) {
        window.location.href = 'login-page.html';
        return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
        alert('Unauthorized access');
        window.location.href = 'login-page.html';
    }
}
window.authGuard = authGuard;

// Logout
function logout() {
    localStorage.clear();
    window.location.href = 'login-page.html';
}
window.logout = logout;
