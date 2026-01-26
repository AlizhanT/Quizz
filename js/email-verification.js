// Email Verification JavaScript Functions

// Resend verification email function
async function resendVerificationEmail() {
    try {
        const result = await window.resendVerificationEmail();
        
        if (result.success) {
            showNotification(t('modal.emailVerification.resendSuccess'), 'success');
        } else {
            showNotification(result.error || t('modal.emailVerification.resendError'), 'error');
        }
    } catch (error) {
        console.error('Error resending verification email:', error);
        showNotification(t('modal.emailVerification.resendError'), 'error');
    }
}

// Close email verification modal and check verification status
async function closeEmailVerificationModal() {
    const modal = document.getElementById('emailVerificationModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Check if email is verified after user claims they verified
    const verificationResult = await window.checkEmailVerification();
    
    if (verificationResult.verified) {
        showNotification(t('modal.emailVerification.resendSuccess'), 'success');
        // Redirect to welcome page with success parameter
        setTimeout(() => {
            window.location.href = 'welcome.html?verified=true';
        }, 1000);
    } else {
        // Show message that verification is still required
        showNotification(t('modal.emailVerification.verificationRequired'), 'warning');
    }
}

// Check email verification status on page load
document.addEventListener('DOMContentLoaded', async function() {
    // Only run if we're on a page that has the email verification modal
    const modal = document.getElementById('emailVerificationModal');
    if (!modal) return;
    
    // Check if user is logged in but email is not verified
    try {
        const user = await window.getCurrentUser();
        if (user && !user.email_confirmed_at) {
            // Show verification modal for unverified users
            showEmailVerificationModal(user.email);
        }
    } catch (error) {
        console.log('Error checking verification status on page load:', error);
    }
});

// Add click handlers for modal buttons
document.addEventListener('DOMContentLoaded', function() {
    // Close modal when clicking outside
    const modal = document.getElementById('emailVerificationModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                // Don't close on outside click - user must explicitly close
            }
        });
    }
    
    // Add escape key handler
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modal = document.getElementById('emailVerificationModal');
            if (modal && modal.style.display === 'flex') {
                // Allow escape to close verification modal
                closeEmailVerificationModal();
            }
        }
    });
});

// Export functions for global access
window.resendVerificationEmail = resendVerificationEmail;
window.closeEmailVerificationModal = closeEmailVerificationModal;
