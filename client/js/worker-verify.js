// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the verification page
    const verifyFormCard = document.getElementById('verifyFormCard');
    if (!verifyFormCard) return;

    authGuard(['professional']);
    setupHeaderUser();

    // Pre-fill some data from localStorage
    const savedName = localStorage.getItem('userName');
    const savedEmail = localStorage.getItem('userEmail');
    const savedMobile = localStorage.getItem('userMobile');

    // Check Status from Server
    checkVerificationStatus(savedEmail);

    if (savedName) {
        const nameInput = document.getElementById('v-name');
        if (nameInput) nameInput.value = savedName;
    }
    if (savedEmail) {
        const emailInput = document.getElementById('v-email');
        if (emailInput) emailInput.value = savedEmail;
    }
    if (savedMobile) {
        const mobileInput = document.getElementById('v-mobile');
        if (mobileInput) mobileInput.value = savedMobile;
    }

    setupRealTimeValidation();

    // Attach global handler
    const form = document.getElementById('verificationForm');
    // If the form doesn't have an ID, we rely on the button or global scope as before.
    // Ideally we add id="verificationForm" to the form in HTML.
    // For now, let's expose it globally as the HTML might be using onsubmit="handleVerification(event)"
});

function setupRealTimeValidation() {
    const fields = [
        { id: 'v-mobile', validator: validateMobile },
        { id: 'v-id-number', validator: validateID },
        { id: 'v-pincode', validator: validatePincode },
        { id: 'v-address', validator: validateAddress },
        { id: 'v-certificate', validator: validateFile },
        { id: 'v-dob', validator: validateDOB }
    ];

    fields.forEach(field => {
        const input = document.getElementById(field.id);
        if (input) {
            input.addEventListener('blur', () => field.validator(input));
            input.addEventListener('input', () => clearError(input));
        }
    });

    const idTypeSelect = document.getElementById('v-id-type');
    if (idTypeSelect) {
        idTypeSelect.addEventListener('change', () => {
            const idNumInput = document.getElementById('v-id-number');
            if (idNumInput && idNumInput.value) validateID(idNumInput);
        });
    }
}

function showError(input, message) {
    const parent = input.parentElement;
    let errorEl = parent.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.style.color = '#dc2626';
        errorEl.style.fontSize = '0.75rem';
        errorEl.style.marginTop = '0.25rem';
        errorEl.style.fontWeight = '500';
        parent.appendChild(errorEl);
    }
    errorEl.textContent = message;
    input.style.borderColor = '#dc2626';
}

function clearError(input) {
    const parent = input.parentElement;
    const errorEl = parent.querySelector('.error-message');
    if (errorEl) errorEl.remove();
    input.style.borderColor = '#cbd5e1';
}

function validateMobile(input) {
    const val = input.value.trim();
    if (!val) return;
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(val)) {
        showError(input, "Must be 10 digits starting with 6-9.");
        return false;
    }
    clearError(input);
    return true;
}

function validatePincode(input) {
    const val = input.value.trim();
    if (!val) return;
    const pinRegex = /^\d{6}$/;
    if (!pinRegex.test(val)) {
        showError(input, "Must be exactly 6 digits.");
        return false;
    }
    clearError(input);
    return true;
}

function validateAddress(input) {
    const val = input.value.trim();
    if (!val) return;
    if (val.length < 15 || val.length > 100) {
        showError(input, "Must be between 15 and 100 characters.");
        return false;
    }
    clearError(input);
    return true;
}

function validateFile(input) {
    if (input.files.length === 0) return;
    const file = input.files[0];
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
        showError(input, "Invalid type. PDF/JPG/PNG only.");
        return false;
    }
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
        showError(input, "File too large. Max 2MB.");
        return false;
    }
    clearError(input);
    return true;
}

function validateID(input) {
    const val = input.value.trim();
    if (!val) return;
    const idType = document.getElementById('v-id-type').value;
    if (!idType) return;

    let idRegex;
    let errMessage;

    switch (idType) {
        case "Aadhaar": idRegex = /^\d{12}$/; errMessage = "Must be 12 digits."; break;
        default: return true;
    }

    if (!idRegex.test(val)) {
        showError(input, errMessage);
        return false;
    }
    clearError(input);
    return true;
}

function validateDOB(input) {
    const val = input.value;
    if (!val) return;
    const dob = new Date(val);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    if (age < 18 || age > 50) {
        showError(input, `Age must be between 18 and 50. (You are ${age})`);
        return false;
    }
    clearError(input);
    return true;
}

async function checkVerificationStatus(email) {
    if (!email) return;
    try {
        const res = await fetch(`http://localhost:5000/api/verification/status?email=${email}`);
        const data = await res.json();
        const formCard = document.getElementById('verifyFormCard');
        const pendingCard = document.getElementById('pendingState');
        const approvedCard = document.getElementById('approvedState');
        const rejectedCard = document.getElementById('rejectedState');

        if (formCard) formCard.style.display = 'none';
        if (pendingCard) pendingCard.style.display = 'none';
        if (approvedCard) approvedCard.style.display = 'none';
        if (rejectedCard) rejectedCard.style.display = 'none';

        if (data.status === 'Approved' && approvedCard) approvedCard.style.display = 'block';
        else if (data.status === 'Pending' && pendingCard) pendingCard.style.display = 'block';
        else if (data.status === 'Rejected' && rejectedCard) rejectedCard.style.display = 'block';
        else if (formCard) formCard.style.display = 'block';

    } catch (err) {
        console.error("Error fetching status:", err);
        const formCard = document.getElementById('verifyFormCard');
        if (formCard) formCard.style.display = 'block';
    }
}

window.handleVerification = function (e) {
    if (e) e.preventDefault();
    const name = document.getElementById('v-name').value;
    const dobInput = document.getElementById('v-dob');
    const dob = dobInput.value;
    const email = document.getElementById('v-email').value;
    const mobile = document.getElementById('v-mobile').value;
    const workerId = localStorage.getItem('workerId');
    const profession = localStorage.getItem('userProfession') || 'Unspecified';
    const gender = document.getElementById('v-gender').value;
    const idType = document.getElementById('v-id-type').value;
    const idNumber = document.getElementById('v-id-number').value;
    const city = document.getElementById('v-city').value;
    const pincode = document.getElementById('v-pincode').value;
    const address = document.getElementById('v-address').value;
    const certificateInput = document.getElementById('v-certificate');
    const certificateFile = certificateInput && certificateInput.files.length > 0 ? certificateInput.files[0] : null;
    const profilePhotoInput = document.getElementById('v-profile-photo');
    const profilePhotoFile = profilePhotoInput && profilePhotoInput.files.length > 0 ? profilePhotoInput.files[0] : null;

    if (!validateDOB(dobInput)) return alert("Please enter a valid Date of Birth (Age 18-50).");
    if (!/^[6-9]\d{9}$/.test(mobile)) return alert("Invalid Mobile Number. It must be 10 digits and start with 6-9.");
    if (!validateID(document.getElementById('v-id-number'))) return alert("Invalid ID Number format.");
    if (!/^\d{6}$/.test(pincode)) return alert("Invalid Pincode. It must be exactly 6 digits.");
    if (address.length < 15 || address.length > 100) return alert("Address must be between 15 and 100 characters.");

    if (!certificateFile) return alert("Please upload a valid certificate.");
    if (certificateFile.size > 2 * 1024 * 1024) return alert("Certificate file is too large. Max 2MB.");

    if (!profilePhotoFile) return alert("Please upload a profile photo.");
    if (profilePhotoFile.size > 20 * 1024 * 1024) return alert("Profile photo is too large. Max 20MB.");

    const readerCert = new FileReader();
    readerCert.onload = function (eventCert) {
        const certBase64 = eventCert.target.result;
        if (certBase64.length > 3 * 1024 * 1024) return alert("Certificate file is too large to store locally.");

        const readerPhoto = new FileReader();
        readerPhoto.onload = function (eventPhoto) {
            const photoBase64 = eventPhoto.target.result;
            saveRequest({
                name, email, mobile, profession, gender, idType, idNumber, city, pincode,
                certificate: certificateFile.name, workerId, certificateData: certBase64,
                profilePhoto: profilePhotoFile.name, profilePhotoData: photoBase64
            });
        };
        readerPhoto.readAsDataURL(profilePhotoFile);
    };
    readerCert.readAsDataURL(certificateFile);
};

async function saveRequest(data) {
    try {
        const res = await fetch('http://localhost:5000/api/verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.msg || 'Submission failed');
        }
        localStorage.setItem('verificationStatus', 'pending');
        document.getElementById('verifyFormCard').style.display = 'none';
        document.getElementById('pendingState').style.display = 'block';
        alert('Verification submitted successfully!');
    } catch (err) {
        console.error(err);
        alert('Error submitting verification: ' + err.message);
    }
}
