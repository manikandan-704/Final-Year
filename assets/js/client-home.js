// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const bookingsContainer = document.getElementById('clientBookingsContainer');
    if (!bookingsContainer) return; // Matches the check in big script

    authGuard(['client']);
    setupHeaderUser();
});
