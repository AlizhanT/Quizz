// Saved Quizzes Management
let quizzes = [];
let currentFilteredQuizzes = [];
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
        showNotification(t('js.savedQuizzes.errorLoading'), 'error');
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

    // Store current filtered quizzes
    currentFilteredQuizzes = quizzesToRender;

    if (quizzes.length === 0) {
        emptyState.style.display = 'flex';
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
    card.className = 'group bg-surface-container-lowest rounded-[2rem] border border-outline-variant/20 hover:shadow-xl transition-all';
    
    let createdDate = t('js.common.unknownDate');
    // Use updated_at if available (shows last edit date), otherwise use created_at
    const dateToUse = quiz.updated_at || quiz.created_at;
    if (dateToUse) {
        try {
            createdDate = new Date(dateToUse).toLocaleDateString();
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
    const quizType = quiz.quiz_type || 'single'; // Default to single if not specified
    
    // Determine icon and color based on quiz type
    const typeIcon = quizType === 'pvp' ? 'groups' : 'person';
    const typeLabel = quizType === 'pvp' ? 'PvP' : 'Single';
    const typeColor = quizType === 'pvp' ? 'bg-tertiary' : 'bg-primary';
    
    // Generate a random gradient background for the card header
    const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)'
    ];
    const randomGradient = gradients[index % gradients.length];
    
    card.innerHTML = `
        <div class="h-44 relative rounded-t-[2rem] overflow-hidden" style="background: ${randomGradient};">
            <div class="absolute inset-0 flex items-center justify-center">
                <div class="text-center">
                    <span class="material-symbols-outlined text-6xl text-white/80">quiz</span>
                </div>
            </div>
            <div class="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-extrabold text-primary uppercase">${questionCount} QUESTIONS</div>
            <div class="absolute top-4 left-4 ${typeColor} text-white px-3 py-1 rounded-full text-[10px] font-extrabold uppercase flex items-center gap-1">
                <span class="material-symbols-outlined text-sm">${typeIcon}</span>
                ${typeLabel}
            </div>
        </div>
        <div class="p-6 relative rounded-b-[2rem]">
            <div class="absolute top-6 right-6">
                <div class="relative">
                    <button class="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors" onclick="toggleQuizMenu(event, ${index})" title="More options">
                        <span class="material-symbols-outlined text-lg">more_vert</span>
                    </button>
                    <div id="quizMenu-${index}" class="absolute right-0 top-full mt-2 w-48 bg-surface-container rounded-xl shadow-lg border border-outline-variant/20 hidden z-50">
                        <button class="w-full px-4 py-3 text-left text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3" onclick="editQuiz(${index})">
                            <span class="material-symbols-outlined text-lg">edit</span>
                            ${t('js.common.editQuiz')}
                        </button>
                        <button class="w-full px-4 py-3 text-left text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3" onclick="duplicateQuiz(${index})">
                            <span class="material-symbols-outlined text-lg">content_copy</span>
                            ${t('quiz.duplicate')}
                        </button>
                        <button class="w-full px-4 py-3 text-left text-sm text-on-surface hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3" onclick="shareQuiz(${index})">
                            <span class="material-symbols-outlined text-lg">link</span>
                            ${t('js.common.shareQuiz')}
                        </button>
                        <button class="w-full px-4 py-3 text-left text-sm text-error hover:bg-error/10 transition-colors flex items-center gap-3" onclick="deleteQuiz(${index})">
                            <span class="material-symbols-outlined text-lg">delete</span>
                            ${t('js.common.deleteQuiz')}
                        </button>
                    </div>
                </div>
            </div>
            <h3 class="text-xl font-extrabold text-on-surface mb-2 group-hover:text-primary transition-colors">${escapeHtml(quiz.title)}</h3>
            <p class="text-sm text-on-surface-variant mb-6">${createdDate}</p>
            ${quiz.instructions ? `<p class="text-sm text-on-surface-variant mb-6 line-clamp-2">${escapeHtml(quiz.instructions.substring(0, 100))}${quiz.instructions.length > 100 ? '...' : ''}</p>` : ''}
            <button class="w-full bg-primary text-on-primary px-6 py-2.5 rounded-xl font-headline font-bold text-sm hover:bg-primary-container transition-all shadow-md shadow-primary/10" onclick="runQuiz(${index})">${t('js.common.runQuiz')}</button>
        </div>
    `;
    
    return card;
}

// Toggle quiz menu dropdown
function toggleQuizMenu(event, index) {
    event.stopPropagation();
    const menu = document.getElementById(`quizMenu-${index}`);
    const allMenus = document.querySelectorAll('[id^="quizMenu-"]');
    
    // Close all other menus
    allMenus.forEach(m => {
        if (m.id !== `quizMenu-${index}`) {
            m.classList.add('hidden');
        }
    });
    
    // Toggle current menu
    menu.classList.toggle('hidden');
}

// Close all quiz menus when clicking outside
document.addEventListener('click', () => {
    const allMenus = document.querySelectorAll('[id^="quizMenu-"]');
    allMenus.forEach(menu => {
        menu.classList.add('hidden');
    });
});

// Search quizzes
function searchQuizzes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    const filteredQuizzes = quizzes.filter(quiz => 
        quiz.title.toLowerCase().includes(searchTerm) ||
        (quiz.instructions && quiz.instructions.toLowerCase().includes(searchTerm))
    );
    
    renderQuizzes(filteredQuizzes);
}

// Toggle About Us section
function toggleAboutUs() {
    const aboutSection = document.getElementById('aboutSection');
    const quizzesGrid = document.getElementById('quizzesGrid');
    const emptyState = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');
    const pageTitle = document.querySelector('h1[data-translate="savedQuizzes"]');
    const aboutButton = document.querySelector('a[onclick="toggleAboutUs()"]');
    const headerSection = document.querySelector('.mb-10.flex.items-end.justify-between');
    
    // Hide quiz-related elements
    quizzesGrid.style.display = 'none';
    emptyState.style.display = 'none';
    noResults.style.display = 'none';
    if (headerSection) {
        headerSection.style.display = 'none';
    }
    
    // Show About Us section
    aboutSection.classList.remove('hidden');
    
    // Update page title
    if (pageTitle) {
        pageTitle.textContent = 'About Us';
    }
    
    // Add active state to About button
    if (aboutButton) {
        aboutButton.classList.add('bg-primary/10', 'text-primary');
    }
    
    // Remove active state from filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Filter quizzes by type
function filterQuizzes(filterType) {
    // Hide About Us section and show quiz elements
    const aboutSection = document.getElementById('aboutSection');
    const quizzesGrid = document.getElementById('quizzesGrid');
    const pageTitle = document.querySelector('h1[data-translate="savedQuizzes"]');
    const aboutButton = document.querySelector('a[onclick="toggleAboutUs()"]');
    const headerSection = document.querySelector('.mb-10.flex.items-end.justify-between');
    
    aboutSection.classList.add('hidden');
    quizzesGrid.style.display = 'grid';
    if (headerSection) {
        headerSection.style.display = 'flex';
    }
    
    // Restore page title
    if (pageTitle) {
        pageTitle.textContent = 'Saved Quizzes';
    }
    
    // Remove active state from About button
    if (aboutButton) {
        aboutButton.classList.remove('bg-primary/10', 'text-primary');
    }
    
    // Update active button state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filterType) {
            btn.classList.add('active');
        }
    });
    
    // Filter quizzes based on type
    let filteredQuizzes;
    if (filterType === 'all') {
        filteredQuizzes = quizzes;
    } else {
        filteredQuizzes = quizzes.filter(quiz => {
            const quizType = quiz.quiz_type || 'single';
            return quizType === filterType;
        });
    }
    
    renderQuizzes(filteredQuizzes);
}

// Clear search
function clearSearch() {
    document.getElementById('searchInput').value = '';
    filterQuizzes('all');
}

// Edit quiz (load to main page)
async function editQuiz(index) {
    const quiz = currentFilteredQuizzes[index];
    const quizType = quiz.quiz_type || 'single'; // Default to single if not specified
    
    // Navigate to editor based on quiz type
    if (quizType === 'pvp') {
        window.location.href = `pvpedit.html?id=${quiz.id}`;
    } else {
        window.location.href = `edit.html?id=${quiz.id}`;
    }
}

// Run quiz
async function runQuiz(index) {
    const quiz = currentFilteredQuizzes[index];
    const quizType = quiz.quiz_type || 'single'; // Default to single if not specified
    
    // Use the new Supabase-based system for single-player quizzes
    if (quizType === 'single') {
        // Save quiz to public_quizzes table for sharing
        const saveResult = await window.saveQuizForRun(quiz);
        
        if (!saveResult.success) {
            showNotification(t('js.savedQuizzes.errorSaving') + ': ' + saveResult.error, 'error');
            return;
        }
        
        const quizId = saveResult.quizId;
        console.log('Quiz saved with ID:', quizId);
        
        // Open test runner with quiz ID
        window.open('test-runner.html?id=' + quizId, '_blank');
    } else {
        // For PvP quizzes, keep using the old localStorage system for now
        localStorage.setItem('pvpTestData', JSON.stringify(quiz));
        window.open('pvp-runner.html', '_blank');
    }
}

// Delete quiz
async function deleteQuiz(index) {
    quizToDelete = index;
    const quiz = currentFilteredQuizzes[index];
    
    // Try to find the modal first
    const deleteModal = document.getElementById('deleteModal');
    if (!deleteModal) {
        console.error('deleteModal not found in DOM');
        showNotification(t('js.savedQuizzes.errorDeleteModal'), 'error');
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
            showNotification(t('js.savedQuizzes.errorUpdateQuizName'), 'error');
            return;
        }
    } else {
        // Fallback: try to find the span directly
        const deleteQuizNameElement = deleteModal.querySelector('#deleteQuizName');
        if (deleteQuizNameElement) {
            deleteQuizNameElement.textContent = quiz.title;
        } else {
            console.error('Neither message paragraph nor deleteQuizName element found');
            showNotification(t('js.savedQuizzes.errorUpdateQuizName'), 'error');
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
            const quizToDeleteData = currentFilteredQuizzes[quizToDelete];
            const result = await window.deleteQuizFromSupabase(quizToDeleteData.id);
            if (result.success) {
                // Find and remove from original quizzes array
                const originalIndex = quizzes.findIndex(q => q.id === quizToDeleteData.id);
                if (originalIndex !== -1) {
                    quizzes.splice(originalIndex, 1);
                }
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

// Show quiz mode modal
function showQuizModeModal() {
    document.getElementById('quizModeModal').style.display = 'flex';
}

// Close quiz mode modal
function closeQuizModeModal() {
    document.getElementById('quizModeModal').style.display = 'none';
}

// Create new quiz
async function createNewQuiz(mode = 'single') {
    // Navigate to editor based on mode
    if (mode === 'pvp') {
        window.location.href = 'pvpedit.html?id=new';
    } else {
        window.location.href = 'edit.html?id=new';
    }
}

// Duplicate quiz
async function duplicateQuiz(index) {
    const quiz = currentFilteredQuizzes[index];
    
    try {
        // Show loading state
        const duplicateBtn = document.querySelectorAll('.btn-duplicate')[index];
        const originalHTML = duplicateBtn.innerHTML;
        duplicateBtn.innerHTML = '<div class="spinner"></div>';
        duplicateBtn.disabled = true;
        
        // Create duplicate data with modified title, preserving quiz type
        const duplicateData = {
            title: `${quiz.title} (Copy)`,
            instructions: quiz.instructions,
            questions: quiz.questions,
            quiz_type: quiz.quiz_type || 'single' // Preserve quiz type
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

// Share quiz
async function shareQuiz(index) {
    const quiz = currentFilteredQuizzes[index];
    
    try {
        // Save quiz to public_quizzes table for sharing
        const saveResult = await window.saveQuizForRun(quiz);
        
        if (!saveResult.success) {
            showNotification(t('js.savedQuizzes.errorSaving') + ': ' + saveResult.error, 'error');
            return;
        }
        
        const quizId = saveResult.quizId;
        
        // Generate shareable link
        const shareLink = `${window.location.origin}/test-runner.html?id=${quizId}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareLink);
        showNotification(t('js.savedQuizzes.linkCopied'), 'success');
        
    } catch (error) {
        console.error('Error sharing quiz:', error);
        showNotification(t('js.savedQuizzes.errorSharing'), 'error');
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
        background: black;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        border: 2px solid black;
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
    const deleteModal = document.getElementById('deleteModal');
    const quizModeModal = document.getElementById('quizModeModal');
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    if (event.target === quizModeModal) {
        closeQuizModeModal();
    }
}

// Language change function
function changeLanguage(lang) {
    if (window.languageManager) {
        window.languageManager.setLanguage(lang);
    }
}
