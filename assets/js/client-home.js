// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Only run auth guard if we are on a protected page
    // client-page.html is the main dashboard for clients
    authGuard(['client']);

    // Setup header user info (email, etc)
    setupHeaderUser();

    // Any other initialization logic for client home...
});
