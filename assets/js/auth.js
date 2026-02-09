// import { setupHeaderUser } from './utils.js'; // Using global util

document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on the Auth Page
    const authForm = document.getElementById('authForm');
    if (!authForm) return;

    setupHeaderUser();

    // State
    let isLoginMode = true; // default is login
    let currentRole = 'client'; // client, professional, admin

    // Elements
    const authTitle = document.getElementById('authTitle');
    const authIcon = document.getElementById('authIcon');
    const submitBtn = document.getElementById('submitBtn');
    const toggleText = document.getElementById('toggleText');
    const adminBtn = document.getElementById('adminBtn');
    const roleBtns = document.querySelectorAll('.role-btn');

    // Fields
    const fieldFullName = document.getElementById('field-fullname');
    const fieldProfession = document.getElementById('field-profession');
    const fieldMobile = document.getElementById('field-mobile');
    const fieldExperience = document.getElementById('field-experience');

    function toggleRequired(element, isRequired) {
        if (!element) return;
        const inputs = element.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            if (isRequired) input.setAttribute('required', 'required');
            else input.removeAttribute('required');
        });
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function updateUI() {
        if (isLoginMode) {
            authTitle.textContent = "Login to your account";
            authIcon.innerHTML = '<i class="fas fa-tools"></i>';
            submitBtn.textContent = "Login";
            toggleText.innerHTML = 'New to DutyFix? <span style="color:#0f172a; font-weight:700; cursor:pointer;" class="toggle-link">Sign Up</span>';
            if (adminBtn) adminBtn.style.display = 'inline-block';
        } else {
            authTitle.textContent = "Join DutyFix IT today";
            authIcon.innerHTML = '<i class="fas fa-user-plus"></i>';
            submitBtn.textContent = `Register as ${capitalize(currentRole)}`;
            toggleText.innerHTML = 'Already have an account? <span style="color:#0f172a; font-weight:700; cursor:pointer;" class="toggle-link">Login</span>';
            if (adminBtn) adminBtn.style.display = 'none';
            if (currentRole === 'admin') currentRole = 'client';
        }

        // Active State
        roleBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase() === currentRole) {
                btn.classList.add('active');
            }
        });

        // Visibility
        if (isLoginMode) {
            if (fieldFullName) fieldFullName.style.display = 'none';
            if (fieldMobile) fieldMobile.style.display = 'none';
            if (fieldProfession) fieldProfession.style.display = 'none';
            if (fieldExperience) fieldExperience.style.display = 'none';

            if (fieldFullName) toggleRequired(fieldFullName, false);
            if (fieldMobile) toggleRequired(fieldMobile, false);
            if (fieldProfession) toggleRequired(fieldProfession, false);
            if (fieldExperience) toggleRequired(fieldExperience, false);
        } else {
            if (fieldFullName) {
                fieldFullName.style.display = 'block';
                toggleRequired(fieldFullName, true);
            }
            if (fieldMobile) {
                fieldMobile.style.display = 'block';
                toggleRequired(fieldMobile, true);
            }
            if (currentRole === 'professional') {
                if (fieldProfession) {
                    fieldProfession.style.display = 'block';
                    toggleRequired(fieldProfession, true);
                }
                if (fieldExperience) {
                    fieldExperience.style.display = 'block';
                    toggleRequired(fieldExperience, false);
                }
            } else {
                if (fieldProfession) {
                    fieldProfession.style.display = 'none';
                    toggleRequired(fieldProfession, false);
                }
                if (fieldExperience) {
                    fieldExperience.style.display = 'none';
                    toggleRequired(fieldExperience, false);
                }
            }
        }
    }

    function setRole(role) {
        currentRole = role;
        updateUI();
    }

    function toggleMode() {
        isLoginMode = !isLoginMode;
        if (!isLoginMode && currentRole === 'admin') currentRole = 'client';
        updateUI();
    }

    function showError(message) {
        let errorDiv = document.getElementById('auth-error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('div');
            errorDiv.id = 'auth-error-message';
            errorDiv.style.color = '#dc2626'; // Red color
            errorDiv.style.marginTop = '10px';
            errorDiv.style.textAlign = 'center';
            errorDiv.style.fontSize = '0.9rem';
            const form = document.getElementById('authForm');
            // Insert before the submit button
            const btn = document.getElementById('submitBtn');
            if (form && btn) {
                form.insertBefore(errorDiv, btn);
            }
        }
        errorDiv.textContent = message;
        // clear after 5 seconds
        setTimeout(() => {
            if (errorDiv) errorDiv.textContent = '';
        }, 5000);
    }

    async function handleAuth(e) {
        e.preventDefault();
        const emailInput = document.querySelector('#field-email input');
        const passInput = document.querySelector('input[type="password"]');
        const email = emailInput ? emailInput.value : '';
        const password = passInput ? passInput.value : '';

        // API URL (assuming backend is on port 5000)
        const API_URL = 'http://localhost:5000/api/auth';

        try {
            if (!isLoginMode) {
                // --- REGISTER MODE ---
                const fullNameElement = fieldFullName.querySelector('input');
                const fullName = fullNameElement ? fullNameElement.value : '';

                const mobileElement = fieldMobile.querySelector('input');
                const mobile = mobileElement ? mobileElement.value : '';

                const professionSelect = fieldProfession.querySelector('select');
                const professionInput = fieldProfession.querySelector('input');
                const profession = professionSelect ? professionSelect.value : (professionInput ? professionInput.value : '');

                const experienceElement = fieldExperience.querySelector('input');
                const experience = experienceElement ? experienceElement.value : '';

                const payload = {
                    name: fullName,
                    email,
                    password,
                    role: currentRole,
                    mobile,
                    profession: currentRole === 'professional' ? profession : undefined,
                    experience: currentRole === 'professional' ? experience : undefined
                };

                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Registration failed');
                }

                window.showToast('Registration successful! Please login.', 'success');
                toggleMode(); // Switch to login view

            } else {
                // --- LOGIN MODE ---
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, role: currentRole })
                });

                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.msg || 'Login failed');
                }

                // Save User Session
                const user = data.user;
                localStorage.setItem('userEmail', user.email);
                localStorage.setItem('userRole', user.role);
                localStorage.setItem('userName', user.name);
                localStorage.setItem('userMobile', user.mobile || '');
                localStorage.setItem('userId', user.id);

                if (user.role === 'professional') {
                    localStorage.setItem('userProfession', user.profession || '');
                    localStorage.setItem('userExperience', user.experience || '');
                    if (user.workerId) localStorage.setItem('workerId', user.workerId);
                }

                window.showToast(`Login successful! Welcome back, ${user.name}.`, 'success');

                setTimeout(() => {
                    if (user.role === 'professional') {
                        window.location.href = 'worker-page.html';
                    } else if (user.role === 'admin') {
                        window.location.href = 'admin-page.html';
                    } else {
                        window.location.href = 'client-page.html';
                    }
                }, 1000); // Wait a bit for the toast to be seen
            }
        } catch (err) {
            console.error(err);
            let msg = err.message;
            if (msg === 'Failed to fetch') {
                msg = 'Connection to server failed. Please ensure the backend server is running on port 5000.';
            }
            window.showToast(msg, 'error');
        }
    }

    // Attach Listeners
    roleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const text = e.target.textContent.toLowerCase();
            if (['client', 'professional', 'admin'].includes(text)) setRole(text);
        });
    });

    if (toggleText) {
        toggleText.addEventListener('click', (e) => {
            if (e.target.tagName === 'SPAN' || e.target.classList.contains('toggle-link')) {
                toggleMode();
            }
        });
    }

    authForm.addEventListener('submit', handleAuth);

    // Initial call
    updateUI();
});
