// Profile Settings JavaScript

// Helper function for translations with fallback
function t(key, params = {}) {
    if (window.languageManager && window.languageManager.t) {
        return window.languageManager.t(key, params);
    }
    // Fallback: return the key if translation system is not ready
    return key;
}

document.addEventListener('DOMContentLoaded', function() {
    initializeProfileSettings();
});

function initializeProfileSettings() {
    // Initialize language system
    initializeLanguageSupport();
    
    // Load current user data
    loadCurrentUser();
    
    // Setup form listeners
    setupUsernameForm();
    setupPasswordForm();
    
    // Setup password validation
    setupPasswordValidation();
    
    // Setup modal close handlers
    setupModalHandlers();
}

function initializeLanguageSupport() {
    // Wait for language manager to be available and ready
    const waitForLanguageManager = () => {
        if (window.languageManager && window.languageManager.translations[window.languageManager.currentLanguage]) {
            // Language manager is ready, apply translations
            window.languageManager.applyTranslations();
            
            // Set language selector to current language
            const selector = document.getElementById('languageSelector');
            if (selector) {
                selector.value = window.languageManager.getCurrentLanguage();
                
                // Add change event listener to auto-save
                selector.addEventListener('change', async function() {
                    const selectedLanguage = this.value;
                    
                    try {
                        // Save to localStorage
                        localStorage.setItem('selectedLanguage', selectedLanguage);
                        
                        // Update language manager
                        await window.languageManager.setLanguage(selectedLanguage);
                        
                        // Show success message
                        showSuccess(t('js.notifications.changesSaved'));
                        
                    } catch (error) {
                        console.error('Error saving language preference:', error);
                        showError('Failed to save language preference. Please try again.');
                    }
                });
            }
        } else {
            // Wait a bit longer and try again
            setTimeout(waitForLanguageManager, 100);
        }
    };
    
    waitForLanguageManager();
}

// Load current user data
async function loadCurrentUser() {
    try {
        const { data: { user }, error } = await window.supabaseClient.auth.getUser();
        
        if (error) {
            console.error('Error getting user:', error);
            document.getElementById('userName').textContent = t('js.common.errorLoadingUser');
            document.getElementById('currentUsername').value = t('js.common.errorLoadingUser');
            return;
        }
        
        if (user) {
            // Try to get display name from metadata first, then email
            let displayName = t('js.common.user');
            
            // Check for full_name first (most common from signup)
            if (user.user_metadata?.full_name) {
                displayName = user.user_metadata.full_name;
            }
            // Then check for custom username
            else if (user.user_metadata?.username) {
                displayName = user.user_metadata.username;
            }
            // Finally use full email if nothing else available
            else if (user.email) {
                displayName = user.email;
            }
            
            // Update username display
            document.getElementById('userName').textContent = displayName;
            document.getElementById('currentUsername').value = displayName;
            
            console.log('Loaded user data:', { 
                email: user.email, 
                displayName: displayName,
                full_name: user.user_metadata?.full_name,
                username: user.user_metadata?.username,
                metadata: user.user_metadata 
            });
        } else {
            // No user found, redirect to login
            console.log('No user found, redirecting to login');
            window.location.href = '../html/welcome.html';
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        document.getElementById('userName').textContent = t('js.common.errorLoadingUser');
        document.getElementById('currentUsername').value = t('js.common.errorLoadingUser');
    }
}

// Setup username form
function setupUsernameForm() {
    const form = document.getElementById('usernameForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const newDisplayName = document.getElementById('newUsername').value.trim();
        
        // Validate display name
        if (!validateUsername(newDisplayName)) {
            showError(t('profile.displayNameHint'));
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.btn-save');
        const originalText = submitBtn.textContent;
        submitBtn.classList.add('loading');
        submitBtn.textContent = t('js.common.updating');
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                // Update user metadata with full_name
                const { error } = await window.supabaseClient.auth.updateUser({
                    data: { full_name: newDisplayName }
                });
                
                if (error) throw error;
                
                // Update UI
                document.getElementById('userName').textContent = newDisplayName;
                document.getElementById('currentUsername').value = newDisplayName;
                document.getElementById('newUsername').value = '';
                
                showSuccess(t('profile.updateDisplayName') + '!');
            }
        } catch (error) {
            console.error('Error updating display name:', error);
            showError(t('js.profileSettings.failedToUpdateDisplayName'));
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    });
}

// Setup password form
function setupPasswordForm() {
    const form = document.getElementById('passwordForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate passwords
        if (!validatePassword(newPassword)) {
            showError(t('auth.passwordTooShort'));
            return;
        }
        
        if (newPassword !== confirmPassword) {
            showError(t('auth.passwordMatch'));
            return;
        }
        
        // Show loading state
        const submitBtn = form.querySelector('.btn-save');
        const originalText = submitBtn.textContent;
        submitBtn.classList.add('loading');
        submitBtn.textContent = t('js.common.updating');
        
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                // First verify current password by signing in
                const { error: signInError } = await window.supabaseClient.auth.signInWithPassword({
                    email: user.email,
                    password: currentPassword
                });
                
                if (signInError) {
                    showError(t('profile.currentPasswordIncorrect'));
                    return;
                }
                
                // Update password
                const { error: updateError } = await window.supabaseClient.auth.updateUser({
                    password: newPassword
                });
                
                if (updateError) throw updateError;
                
                // Clear form
                form.reset();
                resetPasswordValidation();
                
                showSuccess(t('profile.updatePassword') + '!');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showError(t('js.profileSettings.failedToUpdatePassword'));
        } finally {
            // Remove loading state
            submitBtn.classList.remove('loading');
            submitBtn.textContent = originalText;
        }
    });
}

// Setup password validation
function setupPasswordValidation() {
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const updateBtn = document.getElementById('updatePasswordBtn');
    
    newPasswordInput.addEventListener('input', function() {
        const password = this.value;
        const strengthIndicator = document.getElementById('passwordStrength');
        const strengthIcon = document.getElementById('strengthIcon');
        const strengthText = strengthIndicator.querySelector('.indicator-text');
        
        if (password.length >= 6) {
            strengthIndicator.classList.add('valid');
            strengthIndicator.classList.remove('invalid');
            strengthIcon.textContent = '✅';
            strengthIcon.classList.add('valid');
            strengthIcon.classList.remove('invalid');
            strengthText.textContent = t('js.profileSettings.passwordStrength.good');
        } else {
            strengthIndicator.classList.add('invalid');
            strengthIndicator.classList.remove('valid');
            strengthIcon.textContent = '❌';
            strengthIcon.classList.add('invalid');
            strengthIcon.classList.remove('valid');
            strengthText.textContent = t('js.profileSettings.passwordStrength.mustBe6Chars');
        }
        
        checkPasswordMatch();
    });
    
    confirmPasswordInput.addEventListener('input', checkPasswordMatch);
}

function checkPasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchIndicator = document.getElementById('passwordMatch');
    const matchIcon = document.getElementById('matchIcon');
    const matchText = matchIndicator.querySelector('.indicator-text');
    const updateBtn = document.getElementById('updatePasswordBtn');
    
    if (confirmPassword.length === 0) {
        matchIndicator.classList.remove('valid', 'invalid');
        matchIcon.textContent = '';
        matchText.textContent = t('js.profileSettings.passwordMatch.mustMatch');
        updateBtn.disabled = true;
        return;
    }
    
    if (newPassword === confirmPassword && newPassword.length >= 6) {
        matchIndicator.classList.add('valid');
        matchIndicator.classList.remove('invalid');
        matchIcon.textContent = '✅';
        matchIcon.classList.add('valid');
        matchIcon.classList.remove('invalid');
        matchText.textContent = t('js.profileSettings.passwordMatch.match');
        updateBtn.disabled = false;
    } else {
        matchIndicator.classList.add('invalid');
        matchIndicator.classList.remove('valid');
        matchIcon.textContent = '❌';
        matchIcon.classList.add('invalid');
        matchIcon.classList.remove('valid');
        matchText.textContent = t('js.profileSettings.passwordMatch.noMatch');
        updateBtn.disabled = true;
    }
}

function resetPasswordValidation() {
    // Reset password strength indicator
    const strengthIndicator = document.getElementById('passwordStrength');
    const strengthIcon = document.getElementById('strengthIcon');
    const strengthText = strengthIndicator.querySelector('.indicator-text');
    
    strengthIndicator.classList.remove('valid', 'invalid');
    strengthIcon.textContent = '❌';
    strengthIcon.classList.add('invalid');
    strengthIcon.classList.remove('valid');
    strengthText.textContent = t('js.profileSettings.passwordStrength.mustBe6Chars');
    
    // Reset password match indicator
    const matchIndicator = document.getElementById('passwordMatch');
    const matchIcon = document.getElementById('matchIcon');
    const matchText = matchIndicator.querySelector('.indicator-text');
    const updateBtn = document.getElementById('updatePasswordBtn');
    
    matchIndicator.classList.remove('valid', 'invalid');
    matchIcon.textContent = '';
    matchText.textContent = t('js.profileSettings.passwordMatch.mustMatch');
    updateBtn.disabled = true;
}

// Validation functions
function validateUsername(username) {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Delete account functions
function showDeleteConfirmation() {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

async function confirmDeleteAccount() {
    // Show loading state
    const deleteBtn = document.querySelector('.btn-delete');
    const originalText = deleteBtn.textContent;
    deleteBtn.classList.add('loading');
    deleteBtn.textContent = t('js.common.deleting');
    
    try {
        // Use the comprehensive delete function
        const { success, error } = await window.deleteUserAccount();
        
        if (!success) {
            throw new Error(error || 'Failed to delete account');
        }
        
        // Sign out the user
        await window.supabaseClient.auth.signOut();
        
        // Show success message before redirecting
        showSuccess(t('js.profileSettings.accountDeleted'), t('js.notifications.accountDeletedTitle'));
        
        // Redirect after a short delay
        setTimeout(() => {
            window.location.href = '../html/welcome.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error deleting account:', error);
        showError(t('js.profileSettings.failedToDeleteAccount'));
        
        // Sign out user anyway for security
        await window.supabaseClient.auth.signOut();
        window.location.href = '../html/welcome.html';
    } finally {
        deleteBtn.classList.remove('loading');
        deleteBtn.textContent = originalText;
    }
}

// Success modal functions
function showSuccess(message, title = 'Success!') {
    const modal = document.getElementById('successModal');
    const titleElement = document.getElementById('successTitle');
    const messageElement = document.getElementById('successMessage');
    
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// Error display
function showError(message) {
    // Create error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'success-message error-message';
    errorDiv.style.background = 'rgba(220, 53, 69, 0.1)';
    errorDiv.style.borderColor = 'var(--danger-color)';
    errorDiv.style.color = 'var(--danger-color)';
    errorDiv.innerHTML = `
        <span>❌</span>
        <span>${message}</span>
    `;
    
    // Insert at the top of the container
    const container = document.querySelector('.content-wrapper');
    container.insertBefore(errorDiv, container.firstChild);
    
    // Remove after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

// Modal handlers
function setupModalHandlers() {
    // Close modals when clicking outside
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            if (e.target.id === 'deleteModal') {
                closeDeleteModal();
            } else if (e.target.id === 'successModal') {
                closeSuccessModal();
            }
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDeleteModal();
            closeSuccessModal();
        }
    });
}

// Navigation functions
function toggleProfileDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    const selector = document.querySelector('.profile-selector');
    
    dropdown.classList.toggle('show');
    selector.classList.toggle('active');
}

function goToProfile() {
    // Already on profile page
    toggleProfileDropdown();
}

function goToSavedQuizzes() {
    window.location.href = 'saved-quizzes.html';
}

function goToMainApp() {
    window.location.href = 'saved-quizzes.html';
}

async function logout() {
    try {
        await window.supabaseClient.auth.signOut();
        window.location.href = '../html/welcome.html';
    } catch (error) {
        console.error('Error signing out:', error);
        showError(t('auth.logoutFailed'));
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const userProfile = document.querySelector('.user-profile');
    const dropdown = document.getElementById('profileDropdown');
    
    if (!userProfile.contains(e.target)) {
        dropdown.classList.remove('show');
        document.querySelector('.profile-selector').classList.remove('active');
    }
});

// Language support
function changeLanguage(lang) {
    if (window.languageManager) {
        window.languageManager.setLanguage(lang);
    }
}
