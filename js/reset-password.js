// Reset Password Page JavaScript

// DOM elements
const resetPasswordForm = document.getElementById('resetPasswordForm');
const newPasswordInput = document.getElementById('newPassword');
const confirmNewPasswordInput = document.getElementById('confirmNewPassword');
const newPasswordCounter = document.getElementById('newPasswordCounter');
const resetPasswordIndicator = document.getElementById('resetPasswordIndicator');
const resetPasswordMatchIcon = document.getElementById('resetPasswordMatchIcon');
const resetPasswordSubmitBtn = document.getElementById('resetPasswordSubmitBtn');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const successState = document.getElementById('successState');

// Initialize page
document.addEventListener('DOMContentLoaded', async function() {
    // Show modal with animation
    const modalContent = document.querySelector('.auth-modal .modal-content');
    if (modalContent) {
        setTimeout(() => {
            modalContent.style.transform = 'scale(1)';
            modalContent.style.opacity = '1';
        }, 100);
    }
    
    // Extract reset token from URL - Supabase uses different parameter names
    const urlParams = new URLSearchParams(window.location.search);
    const fragmentParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Check both query params and fragment params
    const token = urlParams.get('token') || fragmentParams.get('token');
    const tokenHash = urlParams.get('token_hash') || fragmentParams.get('token_hash');
    const accessToken = urlParams.get('access_token') || fragmentParams.get('access_token');
    const refreshToken = urlParams.get('refresh_token') || fragmentParams.get('refresh_token');
    
    // Try different token sources
    const resetToken = tokenHash || token || accessToken;
    
    console.log('Reset token extraction debug:');
    console.log('Full URL:', window.location.href);
    console.log('Search params:', Object.fromEntries(urlParams.entries()));
    console.log('Hash params:', Object.fromEntries(fragmentParams.entries()));
    console.log('Reset token found:', resetToken);
    
    if (!resetToken) {
        console.error('No reset token found in URL');
        showError();
        return;
    }
    
    // Show loading state
    loadingState.style.display = 'block';
    
    try {
        // For Supabase, we might need to use the session from the URL
        if (accessToken && refreshToken) {
            // Set the session from URL parameters
            const { data, error } = await window.supabaseClient.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            
            console.log('Session set result:', { data, error });
            
            if (error) {
                console.error('Session set error:', error);
                showError();
                return;
            }
            
            // Now show the reset form
            loadingState.style.display = 'none';
            resetPasswordForm.style.display = 'block';
        } else {
            // Try to verify the token directly
            const { data, error } = await window.supabaseClient.auth.verifyOtp({
                token_hash: resetToken,
                type: 'recovery'
            });
            
            console.log('Token verification result:', { data, error });
            
            loadingState.style.display = 'none';
            
            if (error) {
                console.error('Token verification error:', error);
                showError();
            } else {
                // Token is valid, show reset form
                resetPasswordForm.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Token verification error:', error);
        loadingState.style.display = 'none';
        showError();
    }
});

// Password validation functions
function updateNewPasswordCounter(password) {
    const length = password.length;
    const isValid = length >= 6;
    
    newPasswordCounter.textContent = `${length}/6`;
    
    // Update counter color based on validity
    newPasswordCounter.classList.remove('valid', 'invalid');
    newPasswordCounter.classList.add(isValid ? 'valid' : 'invalid');
    
    checkResetPasswordMatch();
}

function checkResetPasswordMatch() {
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmNewPasswordInput.value;
    const isMatch = newPassword === confirmPassword && newPassword.length >= 6;
    
    // Update indicator
    resetPasswordMatchIcon.textContent = isMatch ? '✅' : '❌';
    resetPasswordMatchIcon.style.color = isMatch ? 'var(--success-color)' : 'var(--error-color)';
    
    // Update submit button
    resetPasswordSubmitBtn.disabled = !isMatch;
}

// Event listeners
newPasswordInput.addEventListener('input', function() {
    updateNewPasswordCounter(this.value);
});

confirmNewPasswordInput.addEventListener('input', checkResetPasswordMatch);

// Handle reset password form submission
resetPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const newPassword = newPasswordInput.value;
    
    try {
        // Update user password
        const { data, error } = await window.supabaseClient.auth.updateUser({
            password: newPassword
        });
        
        console.log('Password update result:', { data, error });
        
        if (error) throw error;
        
        // Show success state
        resetPasswordForm.style.display = 'none';
        successState.style.display = 'block';
        
        // Sign out the user to prevent auto-login
        await window.supabaseClient.auth.signOut();
        
        // Redirect to welcome page with success parameter after 2 seconds
        setTimeout(() => {
            window.location.href = 'welcome.html?reset=success';
        }, 2000);
        
    } catch (error) {
        console.error('Password reset error:', error);
        showNotification(error.message || 'Failed to reset password. Please try again.', 'error');
    }
});

// Show error state
function showError() {
    loadingState.style.display = 'none';
    resetPasswordForm.style.display = 'none';
    errorState.style.display = 'block';
}

// Go home safely (sign out to prevent auto-login)
async function goHomeSafely() {
    try {
        // Sign out any existing session to prevent auto-login
        await window.supabaseClient.auth.signOut();
    } catch (error) {
        console.log('No session to sign out:', error);
    }
    
    // Redirect to welcome page
    window.location.href = 'welcome.html';
}

// Show notification function (reuse from welcome.js)
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = 'var(--success-color)';
            break;
        case 'error':
            notification.style.background = 'var(--error-color)';
            break;
        default:
            notification.style.background = 'var(--primary-color)';
    }
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Language change function
function changeLanguage(lang) {
    window.languageManager.setLanguage(lang);
}
