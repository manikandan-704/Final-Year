// import { setupHeaderUser, authGuard } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    // Only run if we are on the worker page
    const profileContainer = document.getElementById('profileContainer');
    if (!profileContainer) return;

    authGuard(['professional']);
    setupHeaderUser();

    // Stats Logic handled by shared update logic or inline here
    // But since this is specific to worker-page.html dashboard view:
    updateWorkerDashboard();

    const workerProfileImg = document.getElementById('workerProfileImg');
    const placeholderIcon = document.getElementById('placeholderIcon');
    const workerName = document.getElementById('workerName');
    const workerProfession = document.getElementById('workerProfession');

    // 1. Get User Details
    const savedName = localStorage.getItem('userName') || "New Worker";

    // Set Name
    workerName.textContent = savedName;

    // 2. Default Avatar Setup
    if (workerProfileImg) {
        // Always ensure image is visible by default (it has source in HTML now)
        workerProfileImg.classList.remove('hidden');
        workerProfileImg.style.display = 'block';
    }

    // Hide initials container by default
    let initialsContainer = document.getElementById('workerInitials');
    if (initialsContainer) {
        initialsContainer.style.display = 'none';
    }


    // 3. Set Profession
    const savedProfession = localStorage.getItem('userProfession');
    if (savedProfession) workerProfession.textContent = savedProfession;
    else workerProfession.style.display = 'none';

    // 4. Load additional info below profile picture
    const savedExperience = localStorage.getItem('userExperience');
    const savedMobile = localStorage.getItem('userMobile');

    let extraInfoContainer = document.getElementById('workerExtraInfo');
    if (!extraInfoContainer) {
        extraInfoContainer = document.createElement('div');
        extraInfoContainer.id = 'workerExtraInfo';
        extraInfoContainer.style.marginTop = '1.5rem';
        extraInfoContainer.style.width = '100%';
        extraInfoContainer.style.display = 'flex';
        extraInfoContainer.style.flexDirection = 'column';
        extraInfoContainer.style.gap = '0.75rem';
        // Append after profession
        workerProfession.parentNode.insertBefore(extraInfoContainer, workerProfession.nextSibling);
    }

    let extraInfoHTML = '';

    if (savedExperience) {
        extraInfoHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                <span style="color: #64748b; font-weight: 500;">Experience</span>
                <span style="color: #0f172a; font-weight: 600;">${savedExperience}</span>
            </div>`;
    }

    if (savedMobile) {
        extraInfoHTML += `
            <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.9rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;">
                <span style="color: #64748b; font-weight: 500;">Phone</span>
                <span style="color: #0f172a; font-weight: 600;">${savedMobile}</span>
            </div>`;
    }

    // Add Profile Link
    extraInfoHTML += `
        <div style="display: flex; align-items: center; justify-content: center; padding-top: 0.75rem; width: 100%;">
            <a href="worker-verify.html" style="color: #2563eb; font-size: 0.85rem; text-decoration: none; font-weight: 600; cursor: pointer;">Profile</a>
        </div>`;

    extraInfoContainer.innerHTML = extraInfoHTML;

    // Display Email
    const workerEmailDisplay = document.getElementById('workerEmailDisplay');
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail && workerEmailDisplay) {
        workerEmailDisplay.textContent = savedEmail;
    }

    // 5. Fetch and Display Approved Details
    if (savedEmail) {
        fetchVerifiedDetails(savedEmail);
    }

    // 6. Fetch Worker Profile (for custom profile picture)
    const workerId = localStorage.getItem('workerId');
    if (workerId) {
        fetchWorkerProfile(workerId);
    }

    // 7. Profile Upload Handler
    const profileUpload = document.getElementById('profileUpload');
    if (profileUpload) {
        profileUpload.addEventListener('change', handleProfileUpload);
    }
});

async function fetchWorkerProfile(workerId) {
    try {
        const res = await fetch(`http://localhost:5000/api/profile/${workerId}`);
        const data = await res.json();

        if (data && data.profilePic) {
            const workerProfileImg = document.getElementById('workerProfileImg');
            const initialsContainer = document.getElementById('workerInitials');

            if (workerProfileImg) {
                workerProfileImg.src = data.profilePic;
                workerProfileImg.dataset.custom = 'true';
                workerProfileImg.classList.remove('hidden');

                workerProfileImg.style.display = 'block';
                workerProfileImg.style.objectFit = 'cover';
                workerProfileImg.style.width = '100px';
                workerProfileImg.style.height = '100px';
                workerProfileImg.style.borderRadius = '50%';
            }
            if (initialsContainer) {
                initialsContainer.classList.add('hidden');
                initialsContainer.style.display = 'none';
            }
        }
    } catch (err) {
        console.error("Failed to fetch worker profile", err);
    }
}

async function handleProfileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate size (e.g. 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert("File size checks: Please upload an image smaller than 5MB.");
        return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64String = reader.result;
        const workerId = localStorage.getItem('workerId');

        try {
            const res = await fetch(`http://localhost:5000/api/profile/${workerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ profilePic: base64String })
            });

            if (res.ok) {
                // Update UI immediately
                const workerProfileImg = document.getElementById('workerProfileImg');
                const initialsContainer = document.getElementById('workerInitials');

                if (workerProfileImg) {
                    workerProfileImg.src = base64String; // Show newly uploaded image
                    workerProfileImg.dataset.custom = 'true';
                    workerProfileImg.classList.remove('hidden');

                    workerProfileImg.style.display = 'block';
                    workerProfileImg.style.objectFit = 'cover';
                }
                if (initialsContainer) {
                    initialsContainer.classList.add('hidden');
                    initialsContainer.style.display = 'none';
                }
                alert("Profile photo updated successfully!");
            } else {
                alert("Failed to update profile photo.");
            }
        } catch (err) {
            console.error("Error uploading profile photo:", err);
            alert("Error uploading profile photo.");
        }
    };
    reader.readAsDataURL(file);
}


async function fetchVerifiedDetails(email) {
    try {
        const res = await fetch(`http://localhost:5000/api/verification/status?email=${email}`);
        const data = await res.json();

        if (data.status === 'Approved' && data.data) {
            // Update Profile Image
            if (data.data.profilePhotoData) {
                const initialsContainer = document.getElementById('workerInitials');
                const workerProfileImg = document.getElementById('workerProfileImg');

                // respect custom profile pic
                if (workerProfileImg && workerProfileImg.dataset.custom === 'true') {
                    // Do nothing, custom image is set
                } else {
                    if (initialsContainer) initialsContainer.style.display = 'none';
                    if (workerProfileImg) {
                        workerProfileImg.src = data.data.profilePhotoData;
                        workerProfileImg.classList.remove('hidden'); // Ensure visible
                        workerProfileImg.style.display = 'block';
                        workerProfileImg.style.objectFit = 'cover';
                        workerProfileImg.style.width = '100px';
                        workerProfileImg.style.height = '100px';
                        workerProfileImg.style.borderRadius = '50%';
                    }
                }
            }


            const extraInfoContainer = document.getElementById('workerExtraInfo');
            if (extraInfoContainer) {
                // Check if already appended to avoid duplicates if called multiple times
                if (!document.getElementById('verified-badge')) {
                    const detailsHTML = `
                    <div id="verified-badge" style="margin-top: 1rem; border-top: 1px solid #e2e8f0; padding-top: 1rem;">
                        <div style="font-size: 0.85rem; color: #15803d; font-weight: 600; margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: center;">
                            <i class="fas fa-check-circle" style="margin-right: 5px;"></i> Verified Worker
                        </div>
                        <div style="font-size: 0.9rem; margin-bottom: 0.25rem;">
                            <span style="color: #64748b;">ID:</span> <span style="font-weight: 500; color: #334155;">${data.data.idType || 'ID'} - ${data.data.idNumber || 'N/A'}</span>
                        </div>
                        <div style="font-size: 0.9rem;">
                            <span style="color: #64748b;">Location:</span> <span style="font-weight: 500; color: #334155;">${data.data.city || 'N/A'}</span>
                        </div>
                    </div>
                    `;
                    extraInfoContainer.innerHTML += detailsHTML; // Append to existing info
                }
            }
        }
    } catch (err) {
        console.error("Failed to fetch verified details", err);
    }
}

async function updateWorkerDashboard() {
    const workerId = localStorage.getItem('workerId');
    if (!workerId) return;

    try {
        // Fetch dashboard stats (Jobs, Rating)
        const resStats = await fetch(`http://localhost:5000/api/bookings/dashboard/${workerId}`);
        const dataStats = await resStats.json();

        // Stats card order has changed because earnings card is removed
        // 1st card -> Jobs Done
        // 2nd card -> Rating
        const jobsEl = document.querySelector('.stats-card:nth-child(1) .stats-value');
        const ratingEl = document.querySelector('.stats-card:nth-child(2) .stats-value');

        if (jobsEl) jobsEl.textContent = dataStats.jobsDone || 0;
        if (ratingEl) {
            const displayRating = dataStats.rating ? Number(dataStats.rating).toFixed(1) : '5.0';
            ratingEl.innerHTML = `${displayRating} <span style="font-size: 0.875rem; color: #64748b; font-weight: 400;">/ 5.0</span>`;
        }

        // Fetch Requests for sidebar notification
        const resReq = await fetch('http://localhost:5000/api/bookings/worker/' + workerId);
        if (resReq.ok) {
            const bookings = await resReq.json();
            const pendingCount = bookings.filter(b => b.status === 'Pending').length;
            // Maybe show a small notification if there are pending requests
            if (pendingCount > 0) {
                const requestsLink = document.querySelector('a[href="request.html"]');
                if (requestsLink) {
                    requestsLink.innerHTML = `Requests <span style="background:#ef4444; color:white; padding:2px 6px; border-radius:10px; font-size:0.7rem; margin-left:4px;">${pendingCount}</span>`;
                }
            }
        }

    } catch (err) {
        console.error('Error updating worker dashboard:', err);
    }
}
