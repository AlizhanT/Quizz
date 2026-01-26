// Side Navigation JavaScript
function toggleSideNav() {
    const sideNavbar = document.getElementById('sideNavbar');
    const overlay = document.getElementById('sideNavOverlay');
    
    if (sideNavbar && overlay) {
        sideNavbar.classList.toggle('open');
        overlay.classList.toggle('show');
    }
}

// Close side navigation when clicking outside
function closeSideNavOnOutsideClick(event) {
    const sideNavbar = document.getElementById('sideNavbar');
    const overlay = document.getElementById('sideNavOverlay');
    
    if (sideNavbar && overlay && !sideNavbar.contains(event.target) && !event.target.closest('.menu-toggle')) {
        sideNavbar.classList.remove('open');
        overlay.classList.remove('show');
    }
}

// Initialize side navigation
document.addEventListener('DOMContentLoaded', function() {
    // Add click listener to close side nav when clicking outside
    document.addEventListener('click', closeSideNavOnOutsideClick);
    
    // Close side nav on escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const sideNavbar = document.getElementById('sideNavbar');
            const overlay = document.getElementById('sideNavOverlay');
            
            if (sideNavbar && overlay) {
                sideNavbar.classList.remove('open');
                overlay.classList.remove('show');
            }
        }
    });
});

// Navigation functions
function goToMainApp() {
    window.location.href = 'edit.html';
}

function goToSavedQuizzes() {
    window.location.href = 'saved-quizzes.html';
}

function openProfileSettings() {
    window.location.href = 'profile-settings.html';
}

function logout() {
    // Clear session/storage
    if (typeof supabase !== 'undefined') {
        supabase.auth.signOut().then(() => {
            window.location.href = 'welcome.html';
        }).catch(error => {
            console.error('Error signing out:', error);
            window.location.href = 'welcome.html';
        });
    } else {
        window.location.href = 'welcome.html';
    }
}

// Set active navigation item based on current page
function setActiveNavItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'edit.html';
    const navItems = document.querySelectorAll('.nav-item');
    const profileInfos = document.querySelectorAll('.profile-info');
    
    navItems.forEach(item => {
        item.classList.remove('active');
        // Remove onclick for current page to prevent reload
        const onclick = item.getAttribute('onclick');
        if (onclick) {
            if ((currentPage === 'saved-quizzes.html' && onclick.includes('goToSavedQuizzes()')) ||
                (currentPage === 'profile-settings.html' && onclick.includes('openProfileSettings()'))) {
                item.setAttribute('onclick', '');
                item.style.cursor = 'default';
            }
        }
    });
    
    // Handle profile info clickability
    profileInfos.forEach(profileInfo => {
        if (currentPage === 'profile-settings.html') {
            // Disable profile click on profile settings page
            profileInfo.style.cursor = 'default';
            profileInfo.style.opacity = '0.6';
            profileInfo.setAttribute('onclick', '');
        } else {
            // Enable profile click on other pages
            profileInfo.style.cursor = 'pointer';
            profileInfo.style.opacity = '1';
            profileInfo.setAttribute('onclick', 'openProfileSettings()');
        }
    });
    
    // Set active based on current page
    if (currentPage === 'saved-quizzes.html') {
        const savedItem = document.querySelector('[onclick*="goToSavedQuizzes"]');
        if (savedItem) savedItem.classList.add('active');
    } else if (currentPage === 'profile-settings.html') {
        const profileItem = document.querySelector('[onclick*="openProfileSettings"]');
        if (profileItem) profileItem.classList.add('active');
    }
}

// Call setActiveNavItem when DOM is loaded
document.addEventListener('DOMContentLoaded', setActiveNavItem);
