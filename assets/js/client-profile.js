// import { setupHeaderUser, authGuard, logout } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const profileForm = document.getElementById('profileForm');
    if (!profileForm) return;

    authGuard(['client']);
    setupHeaderUser();

    const API_URL = 'http://localhost:5000/api/profile';
    const userId = localStorage.getItem('userId');

    // Header Info
    const userEmail = localStorage.getItem('userEmail');
    const headerEmail = document.getElementById('headerEmailDisplay');
    if (headerEmail) headerEmail.textContent = userEmail || 'User';

    fetchProfile();

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await updateProfile();
    });

    async function fetchProfile() {
        try {
            const res = await fetch(`${API_URL}/${userId}`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            const user = await res.json();

            // Populate Form
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };

            setVal('name', user.name);
            setVal('email', user.email);
            setVal('mobile', user.mobile);

            if (user.dob) setVal('dob', new Date(user.dob).toISOString().split('T')[0]);
            setVal('gender', user.gender);

            if (user.address) {
                setVal('flatNumber', user.address.flatNumber);
                setVal('city', user.address.city);
                setVal('pincode', user.address.pincode);
            }

            // Visuals
            const headerName = document.getElementById('headerName');
            const headerAvatar = document.getElementById('profileAvatar');
            const headerRole = document.getElementById('headerRole');
            if (headerName) headerName.textContent = user.name || 'User';
            if (headerRole) headerRole.textContent = 'Client Profile';
            if (headerAvatar) headerAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();

        } catch (err) {
            console.error(err);
            const headerName = document.getElementById('headerName');
            const headerRole = document.getElementById('headerRole');
            if (headerName) headerName.textContent = 'Error loading profile';
            if (headerRole) headerRole.textContent = 'Check connection';
        }
    }

    async function updateProfile() {
        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ''; };

        const data = {
            name: getVal('name'),
            mobile: getVal('mobile'),
            dob: getVal('dob'),
            gender: getVal('gender'),
            address: {
                flatNumber: getVal('flatNumber'),
                city: getVal('city'),
                pincode: getVal('pincode')
            }
        };

        try {
            const res = await fetch(`${API_URL}/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (!res.ok) throw new Error('Failed to update');

            const updatedUser = await res.json();
            localStorage.setItem('userName', updatedUser.name);
            if (updatedUser.mobile) localStorage.setItem('userMobile', updatedUser.mobile);

            alert('Profile updated successfully!');
            fetchProfile();

        } catch (err) {
            alert('Error updating profile.');
            console.error(err);
        }
    }

    // Delete Account Handler
    const deleteBtn = document.querySelector('.btn-danger');
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
            try {
                const res = await fetch(`${API_URL}/${userId}`, { method: 'DELETE' });
                if (res.ok) {
                    alert('Account deleted.');
                    logout();
                } else {
                    alert('Failed to delete account');
                }
            } catch (err) { console.error(err); alert('Error deleting account'); }
        };
    }
});
