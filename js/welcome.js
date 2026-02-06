// Welcome Page JavaScript

// Check if we're on the welcome page - if not, don't run any of this script
const isWelcomePage = window.location.pathname.includes('welcome.html') || window.location.pathname.endsWith('/');
const isMainAppPage = window.location.pathname.includes('edit.html') || window.location.pathname.includes('saved-quizzes.html');

if (!isWelcomePage && !isMainAppPage) {
    console.log('Not on welcome or main app page - skipping welcome.js execution');
} else {

// Initialize the page
document.addEventListener('DOMContentLoaded', async function() {
    // Check for email verification success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('verified') === 'true') {
        showNotification(t('auth.emailVerificationSuccess'), 'success');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Check for password reset success
    if (urlParams.get('reset') === 'success') {
        showNotification(t('auth.passwordResetSuccess'), 'success');
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // Initialize language
    await window.languageManager.loadLanguage();
    
    // Wait for Supabase SDK to be loaded
    await new Promise(resolve => {
        const checkInterval = setInterval(() => {
            if (window.supabaseClient && window.supabaseClient.auth) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
    
    // Check authentication status and update UI accordingly
    await updateAuthUI();
    
    console.log('Page loaded - checking auth status');
});

// Update UI based on authentication status
async function updateAuthUI() {
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    
    if (session) {
        // User is logged in - show profile (only on welcome page)
        if (isWelcomePage) {
            // Show user profile instead of redirecting
            showUserProfile(session.user);
        }
    } else {
        // User is not logged in
        if (isWelcomePage) {
            // On welcome page - show auth buttons, NO modal
            hideUserProfile();
        } else if (isMainAppPage) {
            // On main app pages - show required auth modal
            showRequiredAuthModal();
        }
    }
}

// Show user profile in navigation
function showUserProfile(user) {
    const authButtons = document.querySelector('.auth-buttons');
    const navButtons = document.querySelector('.nav-buttons');
    
    // Only run if we're on welcome page (has these elements)
    if (!authButtons || !navButtons) {
        return;
    }
    
    // Hide auth buttons
    authButtons.style.display = 'none';
    
    // Create and add user profile
    let userProfile = document.querySelector('.user-profile');
    if (!userProfile) {
        userProfile = document.createElement('div');
        userProfile.className = 'user-profile';
        
        const userName = user.user_metadata?.full_name || user.email;
        userProfile.innerHTML = `
            <span class="user-name"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg> ${userName}</span>
            <button class="nav-btn" onclick="goToSavedQuizzes()" data-translate="navigation.myProfile">My Profile</button>
        `;
        
        navButtons.insertBefore(userProfile, authButtons);
    }
}

// Hide user profile and show auth buttons
function hideUserProfile() {
    const authButtons = document.querySelector('.auth-buttons');
    const userProfile = document.querySelector('.user-profile');
    
    // Only run if we're on welcome page
    if (authButtons) {
        authButtons.style.display = 'flex';
    }
    
    if (userProfile) {
        userProfile.remove();
    }
}

// Show required authentication modal (unskippable)
function showRequiredAuthModal() {
    // Only show modal if we're on main app pages (index.html, saved-quizzes.html)
    if (!isMainAppPage) {
        return;
    }
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('requiredAuthModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'requiredAuthModal';
        modal.className = 'modal required-auth-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-icon"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M240-80q-33 0-56.5-23.5T160-160v-400q0-33 23.5-56.5T240-640h40v-80q0-83 58.5-141.5T480-920q83 0 141.5 58.5T680-720v80h40q33 0 56.5 23.5T800-560v400q0 33-23.5 56.5T720-80H240Zm0-80h480v-400H240v400Zm240-120q33 0 56.5-23.5T560-360q0-33-23.5-56.5T480-440q-33 0-56.5 23.5T400-360q0 33 23.5 56.5T480-280ZM360-640h240v-80q0-50-35-85t-85-35q-50 0-85 35t-35 85v80ZM240-160v-400 400Z"/></svg></div>
                <h3 data-translate="modal.auth.login.title">${t('modal.auth.login.title')}</h3>
                <p data-translate="modal.auth.login.description">${t('modal.auth.login.description')}</p>
                <div class="auth-options">
                    <button class="btn-primary large" onclick="goToWelcomePage()" data-translate="hero.learnMore">${t('hero.learnMore')}</button>
                </div>
                <div class="auth-options">
                    <button class="btn-secondary large" onclick="closeModalAndStay()" data-translate="modal.cancel">${t('modal.cancel')}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Add click outside to close (only for welcome page option)
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                // Don't close on outside click - this is a required modal
            }
        });
    }
    
    modal.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 100);
}

// Go to welcome page
function goToWelcomePage() {
    window.location.href = 'welcome.html';
}

// Close modal and stay on current page (user choice)
function closeModalAndStay() {
    const modal = document.getElementById('requiredAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Close required auth modal and allow browsing welcome page
function closeRequiredAuthModal() {
    const modal = document.getElementById('requiredAuthModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Go to main application
function goToMainApp() {
    window.location.href = 'edit.html';
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

// Authentication Modal Functions
function showLoginModal() {
    // Close required auth modal if open
    closeRequiredAuthModal();
    
    const modal = document.getElementById('loginModal');
    modal.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 100);
}

function showSignupModal() {
    // Close required auth modal if open
    closeRequiredAuthModal();
    
    const modal = document.getElementById('signupModal');
    modal.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 100);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = 'none';
}

function switchToSignup() {
    closeModal('loginModal');
    showSignupModal();
}

function switchToLogin() {
    closeModal('signupModal');
    showLoginModal();
}

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Wait for session to be established
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
        if (!session) {
            showNotification('Login successful but session not established. Please try again.', 'error');
            return;
        }
        
        console.log('Session established after login:', session);
        showNotification(t('auth.loginSuccess'), 'success');
        
        // Close all modals
        closeModal('loginModal');
        closeRequiredAuthModal();
        
        // Update UI for logged in user
        await updateAuthUI();
        
        // Redirect to saved-quizzes page
        setTimeout(() => {
            window.location.href = 'saved-quizzes.html';
        }, 1000);
        
    } catch (error) {
        // Provide better error messages for different scenarios
        let errorMessage = t('auth.loginFailed');
        
        if (error.message) {
            if (error.message.includes('Invalid login credentials')) {
                errorMessage = t('auth.userNotFound');
            } else if (error.message.includes('Email not confirmed')) {
                errorMessage = t('auth.emailNotConfirmed');
            } else {
                errorMessage = error.message;
            }
        }
        
        showNotification(errorMessage, 'error');
    }
});

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validate passwords match
    if (password !== confirmPassword) {
        showNotification(t('auth.passwordMismatch'), 'error');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        showNotification(t('auth.passwordTooShort'), 'error');
        return;
    }
    
    try {
        // Use Supabase's admin API to check if user exists (more reliable)
        // Note: This requires service role key, so we'll use a different approach
        // We'll attempt to sign up and handle the "user already exists" error properly
        
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name
                }
            }
        });
        
        if (error) {
            // Log the full error for debugging
            console.log('Signup error details:', {
                message: error.message,
                status: error.status,
                code: error.code
            });
            
            // Check if the error indicates user already exists
            if (error.message.includes('User already registered') || 
                error.message.includes('already registered') ||
                error.message.includes('already been registered') ||
                error.message.includes('A user with this email address has already been registered') ||
                error.status === 422) {
                showNotification(t('auth.emailAlreadyExists'), 'error');
                return;
            }
            throw error;
        }
        
        closeModal('signupModal');
        
        // Check if email confirmation is required
        if (data.user && !data.user.email_confirmed_at) {
            // Email verification is required, show verification modal (no notification)
            showEmailVerificationModal(email);
        } else {
            // No email verification required, show success notification and login modal
            showNotification(t('auth.signupSuccess'), 'success');
            showLoginModal();
        }
        
    } catch (error) {
        // Log the full error for debugging
        console.log('Signup catch block error:', {
            message: error.message,
            status: error.status,
            code: error.code,
            stack: error.stack
        });
        
        showNotification(error.message || t('auth.signupFailed'), 'error');
    }
});

// Handle forgot password form submission
document.getElementById('forgotPasswordForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgotPasswordEmail').value;
    
    try {
        const result = await window.resetPassword(email);
        
        if (result.success) {
            showNotification(t('modal.auth.forgotPassword.success'), 'success');
            closeForgotPasswordModal();
        } else {
            // Show specific error message
            if (result.error.includes('not registered')) {
                showNotification(t('modal.auth.forgotPassword.userNotFound'), 'error');
            } else {
                showNotification(result.error || t('modal.auth.forgotPassword.error'), 'error');
            }
        }
    } catch (error) {
        showNotification(error.message || t('modal.auth.forgotPassword.error'), 'error');
    }
});

// Password validation functions
function updatePasswordCounter(password) {
    const counter = document.getElementById('passwordCounter');
    const length = password.length;
    const isValid = length >= 6;
    
    counter.textContent = `${length}/6`;
    
    // Update counter color based on validity
    counter.classList.remove('valid', 'invalid');
    if (length > 0) {
        if (isValid) {
            counter.classList.add('valid');
        } else {
            counter.classList.add('invalid');
        }
    }
    
    return isValid;
}

function validatePasswordLength(password) {
    return updatePasswordCounter(password);
}

function validatePasswordMatch(password, confirmPassword) {
    const isValid = password === confirmPassword && password.length > 0;
    const indicator = document.getElementById('confirmIndicator');
    const icon = document.getElementById('passwordMatchIcon');
    
    if (confirmPassword.length > 0) {
        if (isValid) {
            indicator.classList.remove('invalid');
            indicator.classList.add('valid');
            icon.textContent = '✅';
            icon.classList.remove('invalid');
            icon.classList.add('valid');
        } else {
            indicator.classList.remove('valid');
            indicator.classList.add('invalid');
            icon.textContent = '❌';
            icon.classList.remove('valid');
            icon.classList.add('invalid');
        }
    } else {
        indicator.classList.remove('valid', 'invalid');
        icon.textContent = '❌';
        icon.classList.remove('valid', 'invalid');
    }
    
    return isValid;
}

function updateSignupButtonState() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const submitBtn = document.getElementById('signupSubmitBtn');
    
    const isLengthValid = validatePasswordLength(password);
    const isMatchValid = validatePasswordMatch(password, confirmPassword);
    
    // Enable submit button only if both validations pass
    if (isLengthValid && isMatchValid) {
        submitBtn.disabled = false;
    } else {
        submitBtn.disabled = true;
    }
}

// Add password validation event listeners
document.getElementById('signupPassword').addEventListener('input', function() {
    const password = this.value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    validatePasswordLength(password);
    validatePasswordMatch(password, confirmPassword);
    updateSignupButtonState();
});

document.getElementById('signupConfirmPassword').addEventListener('input', function() {
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = this.value;
    
    validatePasswordMatch(password, confirmPassword);
    updateSignupButtonState();
});

// Show success modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'flex';
    
    // Add animation
    setTimeout(() => {
        modal.querySelector('.modal-content').style.transform = 'scale(1)';
        modal.querySelector('.modal-content').style.opacity = '1';
    }, 100);
    
    // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'edit.html';
        }, 3000);
}

// Go to saved quizzes page
function goToSavedQuizzes() {
    window.location.href = 'saved-quizzes.html';
}

// Go to main application
function goToMainApp() {
    window.location.href = 'edit.html';
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 3000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
    `;
    
    // Set background color based on type
    switch(type) {
        case 'error':
            notification.style.background = 'var(--danger-color)';
            break;
        case 'success':
            notification.style.background = 'var(--success-color)';
            break;
        default:
            notification.style.background = 'var(--primary-color)';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Close modal when clicking outside
document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
        this.style.display = 'none';
    }
});

document.getElementById('loginModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal('loginModal');
    }
});

document.getElementById('signupModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModal('signupModal');
    }
});

// Add scroll effect to navbar
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.15)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }
});

// Add animation to feature cards when they come into view
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards
document.addEventListener('DOMContentLoaded', function() {
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
    
    // Also observe stats
    const stats = document.querySelectorAll('.stat');
    stats.forEach(stat => {
        stat.style.opacity = '0';
        stat.style.transform = 'translateY(20px)';
        stat.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(stat);
    });
});

// Add hover effect to buttons (removed floating effect)
document.querySelectorAll('button').forEach(button => {
    // Hover effects removed as requested
});

// Add input focus effects
document.querySelectorAll('input, select').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Counter animation for stats
function animateCounter(element, target) {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current).toLocaleString() + (element.textContent.includes('+') ? '+' : '');
    }, 20);
}

// Trigger counter animation when stats come into view
const statsObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.animated) {
            const statNumber = entry.target.querySelector('.stat-number');
            const text = statNumber.textContent;
            const number = parseInt(text.replace(/\D/g, ''));
            
            if (number) {
                animateCounter(statNumber, number);
                entry.target.animated = true;
            }
        }
    });
}, { threshold: 0.5 });

// Observe stats for counter animation
document.addEventListener('DOMContentLoaded', function() {
    const stats = document.querySelectorAll('.stat');
    stats.forEach(stat => {
        statsObserver.observe(stat);
    });
});

// Add parallax effect to hero section
window.addEventListener('scroll', function() {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - scrolled / 800;
    }
});

// Language change function
function changeLanguage(lang) {
    if (window.languageManager) {
        window.languageManager.setLanguage(lang);
    }
}

// Add keyboard navigation
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modals = ['successModal', 'loginModal', 'signupModal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal && modal.style.display === 'flex') {
                closeModal(modalId);
            }
        });
    }
});

// Add smooth reveal animation for sections
const sections = document.querySelectorAll('section');
const sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, { threshold: 0.1 });

sections.forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(50px)';
    section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    sectionObserver.observe(section);
});

// Add revealed class styling
const style = document.createElement('style');
style.textContent = `
    section.revealed {
        opacity: 1 !important;
        transform: translateY(0) !important;
    }
`;
document.head.appendChild(style);

} // End of welcome page check
