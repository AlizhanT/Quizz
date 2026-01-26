// Saved Quizzes Management
let quizzes = [];
let quizToDelete = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Supabase to be initialized
    await new Promise(resolve => {
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100);
    });
    
    // Check authentication
    const isAuthenticated = await window.requireAuth();
    if (!isAuthenticated) {
        return; // Will redirect to welcome page
    }
    
    // Load user information
    try {
        const user = await window.getCurrentUser();
        if (user) {
            const userNameElement = document.getElementById('userName');
            userNameElement.textContent = user.email || t('js.common.user');
            
            // Also display user name if available
            if (user.user_metadata && user.user_metadata.full_name) {
                userNameElement.textContent = user.user_metadata.full_name;
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        document.getElementById('userName').textContent = t('js.common.errorLoadingUser');
    }
    
    await loadQuizzes();
    renderQuizzes();
});

// Load quizzes from Supabase
async function loadQuizzes() {
    const grid = document.getElementById('quizzesGrid');
    try {
        // Show skeleton loading while fetching quizzes
        await window.LoadingUtils.withSkeletonLoading(grid, async () => {
            quizzes = await window.loadQuizzesFromSupabase();
        });
    } catch (error) {
        console.error('Error loading saved quizzes:', error);
        quizzes = [];
        // Show error notification
        showNotification('Error loading quizzes. Please try again.', 'error');
    }
}

// Save quizzes to Supabase (not needed as we save individually)
async function saveQuizzes() {
    // This function is no longer needed as we save quizzes individually to Supabase
    console.log('Individual quiz saves are handled by Supabase client');
}

// Render quizzes to the grid
function renderQuizzes(quizzesToRender = quizzes) {
    const grid = document.getElementById('quizzesGrid');
    const emptyState = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');

    grid.innerHTML = '';

    if (quizzes.length === 0) {
        emptyState.style.display = 'block';
        noResults.style.display = 'none';
        return;
    }

    if (quizzesToRender.length === 0) {
        emptyState.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    noResults.style.display = 'none';

    quizzesToRender.forEach((quiz, index) => {
        const card = createQuizCard(quiz, index);
        grid.appendChild(card);
    });
}

// Create a quiz card element
function createQuizCard(quiz, index) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    
    let createdDate = t('js.common.unknownDate');
    if (quiz.created_at) {
        try {
            createdDate = new Date(quiz.created_at).toLocaleDateString();
            // Check if the date is invalid
            if (createdDate === 'Invalid Date') {
                createdDate = t('js.common.unknownDate');
            }
        } catch (error) {
            console.error('Error parsing date:', error);
            createdDate = t('js.common.unknownDate');
        }
    }
    
    const questionCount = quiz.questions ? quiz.questions.length : 0;
    
    card.innerHTML = `
        <div class="quiz-card-header">
            <h3 class="quiz-title">${escapeHtml(quiz.title)}</h3>
            <div class="quiz-actions">
                <button class="btn-icon btn-edit" onclick="editQuiz(${index})" title="${t('js.common.editQuiz')}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#1976d2"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-160l528-528q12-12 28.5-12t28.5 12l56 57q12 12 12 28.5T812-672L284-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                </button>
                <button class="btn-icon btn-duplicate" onclick="duplicateQuiz(${index})" title="${t('quiz.duplicate')}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5a626aaa"><path d="M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z"/></svg>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteQuiz(${index})" title="${t('js.common.deleteQuiz')}">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#b90808da"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-160l528-528q12-12 28.5-12t28.5 12l56 57q12 12 12 28.5T812-672L284-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
                </button>
            </div>
        </div>
        <div class="quiz-info">
            <div class="quiz-stats">
                <span class="stat">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M280-160v-441q0-33 24-56t57-23h439q33 0 56.5 23.5T880-600v320L680-80H360q-33 0-56.5-23.5T280-160ZM81-710q-6-33 13-59.5t52-32.5l434-77q33-6 59.5 13t32.5 52l10 54h-82l-7-40-433 77 40 226v279q-16-9-27.5-24T158-276L81-710Zm279 110v440h280v-160h160v-280H360Zm220 220Z"/></svg>                    ${questionCount} ${t('js.common.questions')}
                </span>
                <span class="stat">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M200-80q-33 0-56.5-23.5T120-160v-560q0-33 23.5-56.5T200-800h40v-80h80v80h320v-80h80v80h40q33 0 56.5 23.5T840-720v200h-80v-40H200v400h280v80H200Zm0-560h560v-80H200v80Zm0 0v-80 80ZM560-80v-123l221-220q9-9 20-13t22-4q12 0 23 4.5t20 13.5l37 37q8 9 12.5 20t4.5 22q0 11-4 22.5T903-300L683-80H560Zm300-263-37-37 37 37ZM620-140h38l121-122-18-19-19-18-122 121v38Zm141-141-19-18 37 37-18-19Z"/></svg>
                    ${createdDate}
                </span>
            </div>
            ${quiz.instructions ? `<p class="quiz-description">${escapeHtml(quiz.instructions.substring(0, 100))}${quiz.instructions.length > 100 ? '...' : ''}</p>` : ''}
        </div>
        <div class="quiz-card-footer">
            <button class="btn-run" onclick="runQuiz(${index})">${t('js.common.runQuiz')}</button>
        </div>
    `;
    
    return card;
}

// Search quizzes
function searchQuizzes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const clearBtn = document.querySelector('.btn-clear-search');
    
    if (searchTerm) {
        clearBtn.style.display = 'block';
    } else {
        clearBtn.style.display = 'none';
    }
    
    const filteredQuizzes = quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm) ||
        (quiz.instructions && quiz.instructions.toLowerCase().includes(searchTerm))
    );
    
    renderQuizzes(filteredQuizzes);
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    document.querySelector('.btn-clear-search').style.display = 'none';
    renderQuizzes();
}

// Edit quiz (load to main page)
async function editQuiz(index) {
    const quiz = quizzes[index];
    // Navigate to editor with quiz ID in URL
    window.location.href = `edit.html?id=${quiz.id}`;
}

// Run quiz
async function runQuiz(index) {
    const quiz = quizzes[index];
    // Store quiz data in sessionStorage for test runner
    sessionStorage.setItem('testData', JSON.stringify(quiz));
    window.open('test-runner.html', '_blank');
}

// Delete quiz
async function deleteQuiz(index) {
    quizToDelete = index;
    const quiz = quizzes[index];
    
    // Try to find the modal first
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) {
        console.error('deleteModal not found in DOM');
        showNotification('Error: Delete modal not found', 'error');
        return;
    }
    
    // Find the paragraph element that contains the message
    const messageParagraph = deleteModal.querySelector('[data-translate="modal.delete.message"]');
    if (messageParagraph) {
        // Check if the span exists, if not, recreate it
        let deleteQuizNameElement = messageParagraph.querySelector('#deleteQuizName');
        if (!deleteQuizNameElement) {
            // Get the current text content and recreate the HTML structure
            const currentText = messageParagraph.textContent;
            messageParagraph.innerHTML = currentText.replace(/"([^"]*)"/, '"<span id="deleteQuizName"></span>"');
            deleteQuizNameElement = messageParagraph.querySelector('#deleteQuizName');
        }
        
        if (deleteQuizNameElement) {
            deleteQuizNameElement.textContent = quiz.title;
        } else {
            console.error('Could not create or find deleteQuizName element');
            showNotification('Error: Cannot update quiz name', 'error');
            return;
        }
    } else {
        // Fallback: try to find the span directly
        const deleteQuizNameElement = deleteModal.querySelector('#deleteQuizName');
        if (deleteQuizNameElement) {
            deleteQuizNameElement.textContent = quiz.title;
        } else {
            console.error('Neither message paragraph nor deleteQuizName element found');
            showNotification('Error: Cannot update quiz name', 'error');
            return;
        }
    }
    
    // Show the modal
    deleteModal.style.display = 'flex';
}

// Confirm delete
async function confirmDelete() {
    const confirmBtn = document.querySelector('.btn-delete');
    const originalText = confirmBtn.textContent;
    
    try {
        // Show loading state on confirm button
        await window.LoadingUtils.withButtonLoading(confirmBtn, async () => {
            const result = await window.deleteQuizFromSupabase(quizzes[quizToDelete].id);
            if (result.success) {
                quizzes.splice(quizToDelete, 1);
                renderQuizzes();
                closeDeleteModal();
                showNotification(t('quiz.deleteSuccess'), 'success');
            } else {
                showNotification(t('quiz.deleteError') + ': ' + result.error, 'error');
            }
        }, originalText);
    } catch (error) {
        console.error('Error deleting quiz:', error);
        showNotification(t('quiz.deleteError'), 'error');
    }
}

// Close delete modal
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    quizToDelete = null;
}

// Create new quiz
async function createNewQuiz() {
    // Navigate to editor with 'new' parameter
    window.location.href = 'edit.html?id=new';
}

// Duplicate quiz
async function duplicateQuiz(index) {
    const quiz = quizzes[index];
    
    try {
        // Show loading state
        const duplicateBtn = document.querySelectorAll('.btn-duplicate')[index];
        const originalHTML = duplicateBtn.innerHTML;
        duplicateBtn.innerHTML = '<div class="spinner"></div>';
        duplicateBtn.disabled = true;
        
        // Create duplicate data with modified title
        const duplicateData = {
            title: `${quiz.title} (Copy)`,
            instructions: quiz.instructions,
            questions: quiz.questions
            // Don't include id to create new record
        };
        
        // Save to Supabase
        const result = await window.duplicateQuizToSupabase(duplicateData);
        
        if (result.success) {
            // Reload quizzes to show the new duplicate
            await loadQuizzes();
            renderQuizzes();
            showNotification(t('quiz.duplicateSuccess') || 'Quiz duplicated successfully!', 'success');
        } else {
            showNotification(t('quiz.duplicateError') || 'Error duplicating quiz', 'error');
        }
        
        // Restore button
        duplicateBtn.innerHTML = originalHTML;
        duplicateBtn.disabled = false;
        
    } catch (error) {
        console.error('Error duplicating quiz:', error);
        showNotification(t('quiz.duplicateError') || 'Error duplicating quiz', 'error');
        
        // Restore button
        const duplicateBtn = document.querySelectorAll('.btn-duplicate')[index];
        duplicateBtn.innerHTML = originalHTML;
        duplicateBtn.disabled = false;
    }
}

// Utility function to escape HTML
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Show notification function
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 100);
    
    // Hide after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Profile menu functions
function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    const selector = document.querySelector('.profile-selector');
    
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        selector.classList.remove('active');
    } else {
        dropdown.classList.add('show');
        selector.classList.add('active');
    }
}


function logout() {
    // Close the dropdown if open
    const dropdown = document.getElementById('profileDropdown');
    const selector = document.querySelector('.profile-selector');
    if (dropdown) dropdown.classList.remove('show');
    if (selector) selector.classList.remove('active');
    
    // Perform logout
    if (window.supabaseClient) {
        window.supabaseClient.auth.signOut().then(() => {
            window.location.href = 'welcome.html';
        }).catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'welcome.html';
        });
    } else {
        window.location.href = 'welcome.html';
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const profile = document.getElementById('userProfile');
    if (profile && !profile.contains(e.target)) {
        const dropdown = document.getElementById('profileDropdown');
        const selector = document.querySelector('.profile-selector');
        if (dropdown) dropdown.classList.remove('show');
        if (selector) selector.classList.remove('active');
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('deleteModal');
    if (event.target === modal) {
        closeDeleteModal();
    }
}

// Language change function
function changeLanguage(lang) {
    if (window.languageManager) {
        window.languageManager.setLanguage(lang);
    }
}
