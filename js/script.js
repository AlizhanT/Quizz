// SVG Icon Helper Function
function getSVGIcon(iconName, size = 16) {
    const icons = {
        'image': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
        'check': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
        'close': `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
        'plus': `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="navy"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>`,
        'bin': `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="red"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`
    };
    return icons[iconName] || '';
}

// Modal functions
function showModal(title, message, buttons = []) {
    const modal = document.getElementById('notificationModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalButtons = document.getElementById('modalButtons');
    
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    
    // Clear existing buttons
    modalButtons.innerHTML = '';
    
    // Add buttons
    if (buttons.length === 0) {
        // Default OK button
        const okBtn = document.createElement('button');
        okBtn.className = 'modal-btn-primary';
        okBtn.textContent = t('modal.ok');
        okBtn.onclick = closeModal;
        modalButtons.appendChild(okBtn);
    } else {
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = btn.className || 'modal-btn-primary';
            button.textContent = btn.text;
            button.onclick = () => {
                if (btn.onclick) btn.onclick();
                closeModal();
            };
            modalButtons.appendChild(button);
        });
    }
    
    modal.classList.add('show');
    
    // Close on escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    
    // Close on background click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
}

function closeModal() {
    const modal = document.getElementById('notificationModal');
    modal.classList.remove('show');
}

function showNotificationModal(title, message, type = 'info') {
    const buttonClass = type === 'success' ? 'modal-btn-success' : 
                       type === 'error' || type === 'danger' ? 'modal-btn-danger' : 
                       type === 'warning' ? 'modal-btn-secondary' : 'modal-btn-primary';
    
    showModal(title, message, [{
        text: t('modal.ok'),
        className: buttonClass
    }]);
}

function showConfirmModal(title, message, onConfirm, onCancel = null) {
    showModal(title, message, [
        {
            text: t('modal.cancel'),
            className: 'modal-btn-secondary',
            onclick: onCancel || (() => {})
        },
        {
            text: t('modal.confirm'),
            className: 'modal-btn-primary',
            onclick: onConfirm
        }
    ]);
}

// Utility functions
function showTooltip(element) {
    const tooltip = element.querySelector('.custom-tooltip');
    if (tooltip) tooltip.style.display = 'block';
}

function hideTooltip(element) {
    const tooltip = element.querySelector('.custom-tooltip');
    if (tooltip) tooltip.style.display = 'none';
}

function setupTextareaAutoResize(textarea) {
    if (!textarea) return;
    
    setupInputClickHandling(textarea);
    
    function resize() {
        textarea.style.height = 'auto';
        textarea.style.height = Math.max(textarea.scrollHeight, 44) + 'px';
    }
    
    textarea.addEventListener('input', resize);
    textarea.addEventListener('focus', resize);
    setTimeout(resize, 10);
}

function updatePlaceholder(element) {
    const hasContent = (element.textContent && element.textContent.trim() !== '') || element.querySelector('img');
    element.classList.toggle('empty', !hasContent);
}

function setupRichTextInput(element) {
    if (!element) return;
    
    updatePlaceholder(element);
    setupInputClickHandling(element);
    
    element.addEventListener('input', () => {
        updatePlaceholder(element);
        element.style.height = 'auto';
        element.style.height = Math.max(element.scrollHeight, 44) + 'px';
    });
    
    ['focus', 'blur'].forEach(event => element.addEventListener(event, updatePlaceholder));
    
    setTimeout(() => {
        element.style.height = Math.max(element.scrollHeight, 44) + 'px';
    }, 10);
}

function setupInputClickHandling(element) {
    if (!element) return;
    // Allow normal click behavior for all input elements
    // No restrictive click handling needed - let the browser handle focus naturally
}

function setupAutosaveForElement(element) {
    if (!element) return;
    
    // Handle different input types
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.addEventListener('input', triggerAutosave);
    } else if (element.classList.contains('rich-text-input')) {
        element.addEventListener('input', triggerAutosave);
        element.addEventListener('paste', triggerAutosave);
        element.addEventListener('cut', triggerAutosave);
    }
    
    // Also trigger autosave on blur for immediate save when user leaves field
    element.addEventListener('blur', triggerAutosave);
}

// Initialize existing elements
document.addEventListener('DOMContentLoaded', () => {
    const instructionsTextarea = document.getElementById('instructions');
    if (instructionsTextarea) {
        setupTextareaAutoResize(instructionsTextarea);
        setupAutosaveForElement(instructionsTextarea);
    }
    
    const titleInput = document.getElementById('testTitle');
    const titleCounter = document.getElementById('titleCounter');
    if (titleInput && titleCounter) {
        function updateTitleCounter() {
            const currentLength = titleInput.value.length;
            titleCounter.textContent = `${currentLength}/36`;
            titleCounter.style.color = currentLength >= 30 ? '#e74c3c' : 
                                     currentLength >= 25 ? '#f39c12' : '#666';
        }
        titleInput.addEventListener('input', updateTitleCounter);
        setupAutosaveForElement(titleInput);
        updateTitleCounter();
    }
    
    setupInputClickHandling(titleInput);
    setupInputClickHandling(instructionsTextarea);
    
    // Setup mutation observer for dynamic elements
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if (node.tagName === 'TEXTAREA') {
                        setupTextareaAutoResize(node);
                        setupAutosaveForElement(node);
                    }
                    if (node.classList?.contains('rich-text-input')) {
                        setupRichTextInput(node);
                        setupAutosaveForElement(node);
                    }
                    
                    node.querySelectorAll?.('textarea').forEach(el => {
                        setupTextareaAutoResize(el);
                        setupAutosaveForElement(el);
                    });
                    node.querySelectorAll?.('.rich-text-input').forEach(el => {
                        setupRichTextInput(el);
                        setupAutosaveForElement(el);
                    });
                    node.querySelectorAll?.('input').forEach(el => {
                        setupInputClickHandling(el);
                        setupAutosaveForElement(el);
                    });
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    
    // Check for autosave on page load
    setTimeout(() => {
        // Only check for autosave if there's no specific quiz being loaded
        const quizToLoad = localStorage.getItem('quizToLoad');
        if (!quizToLoad) {
        }
    }, 500);
});

// Check for unsaved changes before navigation
async function checkUnsavedChanges() {
    try {
        const currentData = collectTestData();
        const autosaveData = await window.loadAutosaveFromSupabase();
        
        // Check if there are unsaved changes
        if (currentData && currentData.questions && currentData.questions.length > 0) {
            if (!autosaveData) {
                // No autosave exists, user has unsaved work
                return true;
            } else {
                // Compare current data with autosave
                const currentString = JSON.stringify(currentData);
                const savedString = JSON.stringify({
                    title: autosaveData.title,
                    instructions: autosaveData.instructions,
                    questions: autosaveData.questions
                });
                
                // If data is different, there are unsaved changes
                if (currentString !== savedString) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.warn('Error checking unsaved changes:', error);
        return false;
    }
}

// Show save reminder modal
function showSaveReminderModal(callback) {
    showModal(t('modal.unsavedChanges'), t('modal.unsavedChangesMessage'), [
        {
            text: t('modal.dontSave'),
            className: 'modal-btn-secondary',
            onclick: () => {
                closeModal();
                window.location.href = 'saved-quizzes.html';
            }
        },
        {
            text: t('modal.save'),
            className: 'modal-btn-primary',
            onclick: () => {
                closeModal();
                // Trigger save and then proceed with callback
                setTimeout(() => {
                    saveQuiz();
                    // Wait a bit for save to complete, then proceed
                    setTimeout(() => {
                        if (callback) callback();
                    }, 500);
                }, 100);
            }
        }
    ]);
}

// Override navigation functions to check for unsaved changes
async function goToSavedQuizzes() {
    // Check if current project has been saved (has an ID)
    if (!currentEditingQuizId) {
        // Show warning modal for unsaved project
        showUnsavedProjectModal();
    } else {
        // Project is saved, proceed to saved quizzes
        window.location.href = 'saved-quizzes.html';
    }
}

// Show warning modal for unsaved project
function showUnsavedProjectModal() {
    showModal(
        t('modal.unsavedProject'),
        t('modal.unsavedProjectMessage'),
        [
            {
                text: t('modal.leaveAnyway'),
                className: 'modal-btn-secondary',
                onclick: () => {
                    closeModal();
                    window.location.href = 'saved-quizzes.html';
                }
            },
            {
                text: t('modal.saveProject'),
                className: 'modal-btn-primary',
                onclick: () => {
                    closeModal();
                    // Trigger save and then proceed
                    setTimeout(() => {
                        saveQuiz();
                        // Wait a bit for save to complete, then proceed
                        setTimeout(() => {
                            if (currentEditingQuizId) {
                                window.location.href = 'saved-quizzes.html';
                            } else {
                                window.location.href = 'saved-quizzes.html';
                            }
                        }, 1000);
                    }, 100);
                }
            }
        ]
    );
}

async function goToWelcome() {
    if (await checkUnsavedChanges()) {
        showSaveReminderModal(() => {
            window.location.href = 'edit.html';
            window.location.href = 'edit.html';
        });
    } else {
        window.location.href = 'edit.html';
    }
}

// Autosave functionality
function triggerAutosave() {
    // Clear any existing timeout
    if (autosaveTimeout) {
        clearTimeout(autosaveTimeout);
    }
    
    // Set a new timeout to save after AUTOSAVE_DELAY
    autosaveTimeout = setTimeout(() => {
        performAutosave();
    }, AUTOSAVE_DELAY);
}

async function performAutosave() {
    // Only autosave if we have a currentEditingQuizId (quiz has been saved)
    if (!currentEditingQuizId) {
        console.log('Autosave disabled - quiz not saved yet');
        return;
    }
    
    try {
        const testData = collectTestData();
        
        // Only autosave if there's content to save
        if (!testData || testData.questions.length === 0) {
            return;
        }
        
        // Update the actual quiz directly
        testData.id = currentEditingQuizId;
        console.log('Autosaving to actual quiz with ID:', currentEditingQuizId);
        const result = await window.saveQuizToSupabase(testData);
        
        if (result.success) {
            console.log('Quiz autosaved at:', new Date().toISOString());
            // Show subtle autosave indicator (optional)
            showAutosaveIndicator();
        } else {
            console.warn('Autosave failed:', result.error);
        }
        
    } catch (error) {
        console.warn('Autosave failed:', error);
        // Don't show error modal for autosave failures to avoid interrupting user
    }
}

function showAutosaveIndicator() {
    // Create or update autosave indicator
    let indicator = document.getElementById('autosave-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'autosave-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            pointer-events: none;
        `;
        document.body.appendChild(indicator);
    }
    
    indicator.textContent = 'Saved';
    indicator.style.opacity = '1';
    
    // Fade out after 2 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
    }, 2000);
}

function showSubtleNotification(message, type = 'success') {
    // Create or reuse notification container
    let notification = document.getElementById('subtle-notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'subtle-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'info' ? '#3498db' : '#27ae60'};
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
        document.body.appendChild(notification);
    }
    
    // Update content and styling
    notification.textContent = message;
    notification.style.background = type === 'success' ? '#27ae60' : 
                                 type === 'error' ? '#e74c3c' : 
                                 type === 'info' ? '#3498db' : '#27ae60';
    
    // Show notification
    notification.style.opacity = '1';
    notification.style.transform = 'translateY(0)';
    
    // Hide after appropriate time based on type
    const hideDelay = type === 'info' ? 2000 : 1500;
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateY(-10px)';
    }, hideDelay);
}

function setupAutosaveForElement(element) {
    if (!element) return;
    
    // Handle different input types
    if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
        element.addEventListener('input', triggerAutosave);
    } else if (element.classList.contains('rich-text-input')) {
        element.addEventListener('input', triggerAutosave);
        element.addEventListener('paste', triggerAutosave);
        element.addEventListener('cut', triggerAutosave);
    }
    
    // Also trigger autosave on blur for immediate save when user leaves field
    element.addEventListener('blur', triggerAutosave);
}

// Main application state
const { jsPDF } = window.jspdf;
let questionCount = 0;
let draggedElement = null;
let autosaveTimeout = null;
let currentEditingQuizId = null;
const AUTOSAVE_DELAY = 2000; // 2 seconds after typing stops
document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById("addQuestionBtn").addEventListener("click", addQuestionWithLoading);
    
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
            if (userNameElement) {
                userNameElement.textContent = user.email || 'User';
                
                // Also display user name if available
                if (user.user_metadata && user.user_metadata.full_name) {
                    userNameElement.textContent = user.user_metadata.full_name;
                }
            }
        }
    } catch (error) {
        console.error('Error loading user info:', error);
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = 'Error loading user';
        }
    }
    
    // Get quiz ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuizId = urlParams.get('id');
    const pathQuizId = window.location.pathname.split('/').pop();
    const quizId = urlQuizId || pathQuizId;
    
    console.log('URL Parameters Debug:');
    console.log('Full URL:', window.location.href);
    console.log('URL search:', window.location.search);
    console.log('urlQuizId:', urlQuizId);
    console.log('pathQuizId:', pathQuizId);
    console.log('Final quizId:', quizId);
    
    // No authentication required - proceed directly to quiz loading
    
    if (quizId && quizId !== 'new' && quizId !== 'index.html' && quizId !== 'welcome.html') {
        console.log('Attempting to load quiz with ID:', quizId);
        // Load quiz by ID from Supabase
        try {
            const quiz = await window.loadQuizFromSupabase(quizId);
            console.log('Quiz loaded from database:', quiz);
            if (quiz) {
                console.log('Quiz found, loading to editor...');
                loadQuizToEditor(quiz);
                // Update URL to include the ID
                const newUrl = `${window.location.origin}${window.location.pathname}?id=${quizId}`;
                window.history.replaceState({}, '', newUrl);
                console.log('Quiz loaded successfully');
            } else {
                console.log('Quiz not found with ID:', quizId);
                // Fallback to new quiz
                currentEditingQuizId = null;
                addQuestion();
                const firstQuestion = document.querySelector('.question-block');
                if (firstQuestion) initializeDragAndDrop(firstQuestion);
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
            // Fallback to new quiz
            currentEditingQuizId = null;
            addQuestion();
            const firstQuestion = document.querySelector('.question-block');
            if (firstQuestion) initializeDragAndDrop(firstQuestion);
        }
    } else {
        // Initialize with first question for new quiz
        currentEditingQuizId = null;
        addQuestion();
        const firstQuestion = document.querySelector('.question-block');
        if (firstQuestion) initializeDragAndDrop(firstQuestion);
    }
});

// Load quiz data into the editor
function loadQuizToEditor(quizData) {
    console.log('Loading quiz to editor:', quizData);
    
    // Set the current editing quiz ID (only for real quizzes, not autosave)
    if (quizData.id && quizData.id !== 'autosave_current') {
        currentEditingQuizId = quizData.id;
    } else {
        currentEditingQuizId = null;
    }
    
    // Clear existing questions
    const container = document.getElementById('questionsContainer');
    container.innerHTML = '';
    questionCount = 0;
    
    // Set title and instructions
    document.getElementById('testTitle').value = quizData.title || '';
    document.getElementById('instructions').value = quizData.instructions || '';
    
    // Update title counter
    const titleInput = document.getElementById('testTitle');
    const titleCounter = document.getElementById('titleCounter');
    if (titleInput && titleCounter) {
        const currentLength = titleInput.value.length;
        titleCounter.textContent = `${currentLength}/36`;
        titleCounter.style.color = currentLength >= 30 ? '#e74c3c' : 
                                 currentLength >= 25 ? '#f39c12' : '#666';
    }
    
    // Load questions
    if (quizData.questions && quizData.questions.length > 0) {
        quizData.questions.forEach((questionData, index) => {
            addQuestion();
            const questionBlock = container.lastElementChild;
            populateQuestionBlock(questionBlock, questionData);
        });
    } else {
        // Add at least one empty question if no questions exist
        addQuestion();
        const firstQuestion = document.querySelector('.question-block');
        if (firstQuestion) initializeDragAndDrop(firstQuestion);
    }
    
    // Update remove buttons visibility
    updateRemoveButtonsVisibility();
}

// Populate a question block with data
function populateQuestionBlock(block, questionData) {
    // Set question type
    const typeSelect = block.querySelector('.question-type');
    typeSelect.value = questionData.type;
    
    // Set question text
    const questionTextElement = block.querySelector('.rich-text-input.question-text');
    if (questionTextElement && questionData.question) {
        questionTextElement.innerHTML = questionData.question;
        updatePlaceholder(questionTextElement);
    }
    
    // Load question images
    if (questionData.images && questionData.images.length > 0) {
        const previewContainer = block.querySelector('.image-preview-container');
        if (previewContainer) {
            questionData.images.forEach(imageData => {
                const previewWrapper = document.createElement('div');
                previewWrapper.className = 'image-preview-wrapper';
                
                const img = document.createElement('img');
                img.src = imageData.src;
                img.dataset.name = imageData.name || 'image';
                img.className = 'preview-image';
                
                const removeBtn = document.createElement('button');
                removeBtn.className = 'remove-image-btn';
                removeBtn.textContent = '✖';
                removeBtn.onclick = () => previewWrapper.remove();
                
                previewWrapper.appendChild(img);
                previewWrapper.appendChild(removeBtn);
                previewContainer.appendChild(previewWrapper);
            });
        }
    }
    
    // Render question content based on type
    const contentBox = block.querySelector('.question-content');
    typeSelect.onchange(); // This will render the appropriate content
    
    // Populate type-specific data
    setTimeout(() => {
        if (questionData.type === 'multiple') {
            populateMultipleChoice(block, questionData);
        } else if (questionData.type === 'fill') {
            populateFillInBlank(block, questionData);
        } else if (questionData.type === 'matching') {
            populateMatching(block, questionData);
        }
    }, 100);
}

// Populate multiple choice question
function populateMultipleChoice(block, questionData) {
    const answersGrid = block.querySelector('.answers-grid');
    answersGrid.innerHTML = '';
    
    if (questionData.options && questionData.options.length > 0) {
        questionData.options.forEach((optionData, index) => {
            addAnswer(answersGrid);
            const lastOption = answersGrid.lastElementChild;
            
            // Set option text
            const input = lastOption.querySelector('.rich-text-input.answer-input');
            if (input && optionData.text) {
                input.innerHTML = optionData.text;
                updatePlaceholder(input);
            }
            
            // Set correct answer
            if (questionData.correctAnswer === index) {
                const correctBtn = lastOption.querySelector('.correct-answer-btn');
                if (correctBtn) correctBtn.classList.add('selected');
            }
            
            // Populate option images
            const optionPreview = lastOption.querySelector('.image-preview-container');
            if (optionPreview && optionData.images && optionData.images.length > 0) {
                optionData.images.forEach(imageData => {
                    const previewWrapper = createImagePreviewWrapper(imageData.src, imageData.name || 'image');
                    optionPreview.appendChild(previewWrapper);
                });
            }
        });
    }
    
    // Populate question images
    const questionPreview = block.querySelector('.image-preview-container');
    if (questionPreview && questionData.images && questionData.images.length > 0) {
        questionData.images.forEach(imageData => {
            const previewWrapper = createImagePreviewWrapper(imageData.src, imageData.name || 'image');
            questionPreview.appendChild(previewWrapper);
        });
    }
}

// Populate fill in the blank question
function populateFillInBlank(block, questionData) {
    const sentenceElement = block.querySelector('.fill-sentence');
    if (sentenceElement && questionData.sentence) {
        sentenceElement.value = questionData.sentence;
    }
    
    const draggableAnswers = block.querySelector('.draggable-answers');
    if (!draggableAnswers) return;
    
    // Get or create the options container
    let optionsList = draggableAnswers.querySelector('.fill-options-list');
    if (!optionsList && questionData.options && questionData.options.length > 0) {
        optionsList = document.createElement('div');
        optionsList.className = 'fill-options-list';
        draggableAnswers.appendChild(optionsList);
    }
    
    if (optionsList && questionData.options && questionData.options.length > 0) {
        optionsList.innerHTML = '';
        questionData.options.forEach(optionText => {
            const optionChip = document.createElement('div');
            optionChip.className = 'fill-option-chip';
            optionChip.dataset.isCorrect = 'true';
            optionChip.innerHTML = `
                <span class="option-text">${optionText}</span>
                <button class="remove-option-btn" onclick="this.parentElement.remove()">×</button>
            `;
            optionsList.appendChild(optionChip);
        });
    }
}

// Populate matching question
function populateMatching(block, questionData) {
    const pairsContainer = block.querySelector('.matching-pairs');
    pairsContainer.innerHTML = '';
    
    if (questionData.pairs && questionData.pairs.length > 0) {
        questionData.pairs.forEach(pairData => {
            const addPairBtn = block.querySelector('.add-pair-btn');
            if (addPairBtn) {
                addPairBtn.click();
                const newRow = pairsContainer.lastElementChild;
                
                if (newRow) {
                    // Set left content
                    const leftInput = newRow.querySelector('.rich-text-input.matching-left');
                    if (leftInput && pairData.left) {
                        leftInput.innerHTML = pairData.left;
                        updatePlaceholder(leftInput);
                    }
                    
                    // Set right content
                    const rightInput = newRow.querySelector('.rich-text-input.matching-right');
                    if (rightInput && pairData.right) {
                        rightInput.innerHTML = pairData.right;
                        updatePlaceholder(rightInput);
                    }
                    
                    // Load left images
                    if (pairData.leftImages && pairData.leftImages.length > 0) {
                        const leftPreviewContainer = newRow.querySelectorAll('.image-preview-container')[0];
                        if (leftPreviewContainer) {
                            pairData.leftImages.forEach(imageData => {
                                const previewWrapper = createImagePreviewWrapper(imageData.src, imageData.name || 'image');
                                leftPreviewContainer.appendChild(previewWrapper);
                            });
                        }
                    }
                    
                    // Load right images
                    if (pairData.rightImages && pairData.rightImages.length > 0) {
                        const rightPreviewContainer = newRow.querySelectorAll('.image-preview-container')[1];
                        if (rightPreviewContainer) {
                            pairData.rightImages.forEach(imageData => {
                                const previewWrapper = createImagePreviewWrapper(imageData.src, imageData.name || 'image');
                                rightPreviewContainer.appendChild(previewWrapper);
                            });
                        }
                    }
                }
            }
        });
    }
}

// Drag and drop functionality
function initializeDragAndDrop(block) {
    const dragHandle = block.querySelector('.drag-handle');
    dragHandle.draggable = true;
    
    dragHandle.addEventListener('dragstart', handleDragStart);
    dragHandle.addEventListener('dragend', handleDragEnd);
    
    block.addEventListener('dragover', handleDragOver);
    block.addEventListener('drop', handleDrop);
    block.addEventListener('dragenter', handleDragEnter);
    block.addEventListener('dragleave', handleDragLeave);
}

function handleDragStart(e) {
    draggedElement = this.closest('.question-block');
    draggedElement.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', draggedElement.innerHTML);
    
    const randomRotation = Math.random() * 10 - 5;
    draggedElement.style.transform = `rotate(${randomRotation}deg) scale(1.05)`;
    
    document.querySelectorAll('.question-block').forEach(block => {
        if (block !== draggedElement) {
            block.classList.add('drag-over');
            const targetRotation = Math.random() * 6 - 3;
            block.style.transform = `rotate(${targetRotation}deg) scale(1.02)`;
        }
    });
}

function handleDragEnd(e) {
    const block = this.closest('.question-block');
    block.classList.remove('dragging');
    block.style.transform = '';
    
    document.querySelectorAll('.question-block').forEach(questionBlock => {
        questionBlock.classList.remove('drag-over');
        questionBlock.style.transform = '';
    });
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (this !== draggedElement) {
        this.classList.add('drag-over');
        const targetRotation = Math.random() * 6 - 3;
        this.style.transform = `rotate(${targetRotation}deg) scale(1.02)`;
    }
}

function handleDragLeave(e) {
    // Don't remove drag-over effect during drag
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    
    if (draggedElement !== this) {
        const container = document.getElementById('questionsContainer');
        const allBlocks = Array.from(container.children);
        const draggedIndex = allBlocks.indexOf(draggedElement);
        const targetIndex = allBlocks.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            container.insertBefore(draggedElement, this.nextSibling);
        } else {
            container.insertBefore(draggedElement, this);
        }
        
        renumberQuestions();
        triggerAutosave(); // Trigger autosave after reordering questions
    }
}

// Wrapper function for addQuestion with loading state
async function addQuestionWithLoading() {
    const addBtn = document.getElementById("addQuestionBtn");
    const originalText = addBtn ? addBtn.textContent : 'Add Question';
    
    try {
        // Show brief loading state on the button
        if (addBtn) {
            await window.LoadingUtils.withButtonLoading(addBtn, async () => {
                // Small delay to show loading state
                await new Promise(resolve => setTimeout(resolve, 300));
                addQuestion();
            }, originalText);
        } else {
            addQuestion();
        }
    } catch (error) {
        console.error('Error adding question:', error);
        addQuestion(); // Fallback to original function
    }
}

function addQuestion(insertAfterElement = null) {
    questionCount++;
    const container = document.getElementById("questionsContainer");
    const block = document.createElement("div");
    block.className = "question-block";
    
    block.innerHTML = `
        <div class="question-header">
            <div style="display: flex; align-items: center;">
                <span class="question-number">${questionCount}</span>
                <div class="typing-warning-indicator" style="width: 20px; height: 20px; background-color: #9090e1ff; border-radius: 50%; color: white; font-size: 12px; font-weight: bold; cursor: default; display: none; align-items: center; justify-content: center; margin-left: 8px; position: relative;" onmouseenter="showTooltip(this)" onmouseleave="hideTooltip(this)" data-translate="quiz.typingWarning">!
                    <div class="custom-tooltip" style="position: absolute; bottom: 25px; left: 0; background-color: white; color: black; padding: 8px 12px; border-radius: 4px; font-size: 12px; white-space: nowrap; z-index: 1000; display: none; pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 1px solid #e0e0e0;" data-translate="quiz.typingWarningTooltip">This question type will be included in PDF but ignored by test runner</div>
                </div>
            </div>
            <div class="question-buttons">
                <div class="drag-handle"></div>
                <button class="copy-btn"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="navy"><path d="M520-400h80v-120h120v-80H600v-120h-80v120H400v80h120v120ZM320-240q-33 0-56.5-23.5T240-320v-480q0-33 23.5-56.5T320-880h480q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H320Zm0-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg></button>
                <button class="remove-btn"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#df2727ff"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg></button>
            </div>
        </div>
        <div class="form-group question-type-wrapper">
            <label data-translate="quiz.questionType">Question Type</label>
            <div class="select-wrapper">
                <select class="question-type">
                    <option value="multiple" data-translate="quiz.multipleChoice">Multiple Choice</option>
                    <option value="typing" data-translate="quiz.typingAnswer">Typing Answer</option>
                    <option value="fill" data-translate="quiz.fillBlank">Fill in the Blank</option>
                    <option value="matching" data-translate="quiz.matching">Matching</option>
                </select>
                <div class="select-arrow">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e3e3e3"><path d="M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z"/></svg>
                </div>
            </div>
        </div>
        <div class="form-group">
            <label data-translate="quiz.questionText">Question Text</label>
            <div class="input-with-image">
                <div class="rich-text-input question-text" contenteditable="true" data-translate-placeholder="quiz.questionPlaceholder" data-placeholder="Enter your question here..."></div>
                <button class="image-upload-btn" onclick="handleImageUpload(this, 'question')" title="Add image"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="black"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg></button>
            </div>
            <div class="image-preview-container" id="question-preview-${questionCount}"></div>
        </div>
        <div class="question-content"></div>
    `;
    
    // Insert the block at the appropriate position
    if (insertAfterElement) {
        container.insertBefore(block, insertAfterElement.nextSibling);
    } else {
        container.appendChild(block);
    }
    
    // Setup event handlers and functionality
    setupQuestionBlock(block);
    
    // Trigger autosave after adding a question
    triggerAutosave();
    
    // Scroll to the newly added question
    setTimeout(() => {
        block.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function setupQuestionBlock(block) {
    const typeSelect = block.querySelector(".question-type");
    const contentBox = block.querySelector(".question-content");
    
    renderQuestionContent(typeSelect.value, contentBox);
    
    typeSelect.onchange = () => {
        renderQuestionContent(typeSelect.value, contentBox);
        const warningIndicator = block.querySelector('.typing-warning-indicator');
        if (warningIndicator) {
            warningIndicator.style.display = typeSelect.value === 'typing' ? 'flex' : 'none';
        }
        triggerAutosave(); // Trigger autosave when question type changes
    };
    
    // Setup buttons
    const removeBtn = block.querySelector(".remove-btn");
    removeBtn.onclick = () => {
        block.remove();
        renumberQuestions();
        questionCount--;
        updateRemoveButtonsVisibility();
        triggerAutosave(); // Trigger autosave after removing a question
    };
    
    const copyBtn = block.querySelector(".copy-btn");
    copyBtn.onclick = () => copyQuestion(block);
    
    // Initialize drag and drop
    initializeDragAndDrop(block);
    
    // Setup auto-resize for textareas and rich text inputs
    block.querySelectorAll('textarea').forEach(setupTextareaAutoResize);
    block.querySelectorAll('.rich-text-input').forEach(setupRichTextInput);
    
    updateRemoveButtonsVisibility();
}

// Answer management
function addAnswer(grid) {
    const option = document.createElement("div");
    option.className = "answer-option";
    
    const inputContainer = document.createElement("div");
    inputContainer.className = "answer-input-container";
    
    const input = document.createElement("div");
    input.className = "rich-text-input answer-input";
    input.contentEditable = true;
    input.dataset.placeholder = "Answer option";
    input.setAttribute('data-translate-placeholder', 'quiz.answerPlaceholder');
    
    const uploadBtn = document.createElement("button");
    uploadBtn.className = "image-upload-btn small";
    uploadBtn.innerHTML = getSVGIcon('image');
    uploadBtn.title = "Add image";
    uploadBtn.setAttribute('data-translate-title', 'quiz.addImage');
    uploadBtn.onclick = () => handleImageUpload(uploadBtn, 'answer', option);
    
    inputContainer.appendChild(input);
    inputContainer.appendChild(uploadBtn);
    
    const correctBtn = document.createElement("button");
    correctBtn.className = "correct-answer-btn";
    correctBtn.innerHTML = getSVGIcon('check');
    correctBtn.onclick = () => {
        grid.querySelectorAll('.correct-answer-btn').forEach(btn => btn.classList.remove('selected'));
        correctBtn.classList.add('selected');
        triggerAutosave(); // Trigger autosave when correct answer changes
    };
    
    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-option-btn";
    removeBtn.innerHTML = getSVGIcon('close');
    removeBtn.onclick = () => option.remove();
    
    const previewContainer = document.createElement("div");
    previewContainer.className = "image-preview-container small";
    
    option.appendChild(inputContainer);
    option.appendChild(correctBtn);
    option.appendChild(removeBtn);
    option.appendChild(previewContainer);
    grid.appendChild(option);
}

// Fill options management
function addFillOptions(button) {
    const container = button.closest('.form-group');
    const input = container.querySelector('.fill-options-input');
    const draggableAnswers = container.querySelector('.draggable-answers');
    
    if (!input || !draggableAnswers) return;
    
    const optionsText = input.value.trim();
    if (!optionsText) return;
    
    const options = optionsText.split(',').map(opt => opt.trim()).filter(opt => opt);
    
    const sentence = container.parentElement.querySelector('.fill-sentence').value;
    
    // Get or create the options container
    let optionsContainer = draggableAnswers.querySelector('.fill-options-list');
    if (!optionsContainer) {
        optionsContainer = document.createElement('div');
        optionsContainer.className = 'fill-options-list';
        draggableAnswers.appendChild(optionsContainer);
    }
    
    options.forEach(optionText => {
        const optionChip = document.createElement('div');
        optionChip.className = 'fill-option-chip';
        optionChip.dataset.answer = optionText;
        
        // Check if option exists as a complete word in sentence
        // Create regex to match exact word with word boundaries, including punctuation
        const wordRegex = new RegExp(`(?:^|\\s)${optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|[.,!?;:()[\]{}"']|$)`, 'i');
        const existsInSentence = wordRegex.test(sentence);
        
        if (existsInSentence) {
            optionChip.dataset.isCorrect = 'true';
        } else {
            optionChip.dataset.isCorrect = 'false';
        }
        
        // Create consistent structure with nested span for text
        const optionTextSpan = document.createElement('span');
        optionTextSpan.className = 'option-text';
        optionTextSpan.textContent = optionText;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-option-btn';
        removeBtn.setAttribute('data-translate', 'modal.removeImage');
        removeBtn.textContent = '×';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            optionChip.remove();
        };
        
        optionChip.appendChild(optionTextSpan);
        optionChip.appendChild(removeBtn);
        optionsContainer.appendChild(optionChip);
    });
    
    input.value = '';
}

function renderQuestionContent(type, container) {
    container.innerHTML = "";

    if (type === "multiple") {
        const grid = document.createElement("div");
        grid.className = "answers-grid";

        const addBtn = document.createElement("button");
        addBtn.className = "add-option-btn";
        addBtn.innerHTML = getSVGIcon('plus');

        for (let i = 0; i < 4; i++) addAnswer(grid);
        addBtn.onclick = () => {
            // Check current number of answers
            const currentAnswers = grid.querySelectorAll('.answer-option');
            if (currentAnswers.length >= 6) {
                // Silently prevent adding more than 6 options
                return;
            }
            addAnswer(grid);
        };

        container.appendChild(grid);
        container.appendChild(addBtn);
    }

    if (type === "typing") {
        container.innerHTML = `
            <div class="form-group">
                <label data-translate="quiz.answer">Answer</label>
                <div class="input-with-image">
                    <div class="rich-text-input typing-answer" contenteditable="true" data-translate-placeholder="quiz.typingAnswerPlaceholder" data-placeholder="Enter your answer here..."></div>
                    <button class="image-upload-btn" onclick="handleImageUpload(this, 'typing')" data-translate-title="quiz.addImage" title="Add image"><svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="black"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg></button>
                </div>
                <div class="image-preview-container" id="typing-preview-${questionCount}"></div>
            </div>
        `;
        
        setTimeout(() => {
            const typingInput = container.querySelector('.rich-text-input.typing-answer');
            if (typingInput) {
                setupRichTextInput(typingInput);
            }
        }, 10);
    }

    if (type === "matching") {
        const wrapper = document.createElement("div");
        wrapper.className = "matching-wrapper";

        const pairs = document.createElement("div");
        pairs.className = "matching-pairs";

        const addPairBtn = document.createElement("button");
        addPairBtn.innerHTML = getSVGIcon('plus');
        addPairBtn.className = "add-pair-btn";
        
        const remPairBtn = document.createElement("button");
        remPairBtn.innerHTML = getSVGIcon('close');
        remPairBtn.className = "rem-pair-btn";

        function addPair() {
            const row = document.createElement("div");
            row.className = "matching-row";

            row.innerHTML = `
                <div class="matching-input-container">
                    <div class="rich-text-input matching-left" contenteditable="true" data-translate-placeholder="quiz.leftSide" data-placeholder="Left side"></div>
                    <button class="image-upload-btn small" onclick="handleImageUpload(this, 'matching-left', this.parentElement.parentElement)" data-translate-title="quiz.addImage" title="Add image">${getSVGIcon('image')}</button>
                </div>
                <div class="matching-input-container">
                    <div class="rich-text-input matching-right" contenteditable="true" data-translate-placeholder="quiz.rightSide" data-placeholder="Right side"></div>
                    <button class="image-upload-btn small" onclick="handleImageUpload(this, 'matching-right', this.parentElement.parentElement)" data-translate-title="quiz.addImage" title="Add image">${getSVGIcon('image')}</button>
                </div>
                <div class="matching-preview-container">
                    <div class="image-preview-container small" id="left-preview-${Date.now()}-${Math.random()}"></div>
                    <div class="image-preview-container small" id="right-preview-${Date.now()}-${Math.random()}"></div>
                </div>
            `;

            pairs.appendChild(row);
            
            const leftInput = row.querySelector('.rich-text-input.matching-left');
            const rightInput = row.querySelector('.rich-text-input.matching-right');
            if (leftInput) setupRichTextInput(leftInput);
            if (rightInput) setupRichTextInput(rightInput);
        }
    
        function remPair() {
            if (pairs.lastElementChild) {
                pairs.lastElementChild.remove();
            }
        }

        for (let i = 0; i < 3; i++) addPair();
        addPairBtn.onclick = addPair;
        remPairBtn.onclick = remPair;

        wrapper.appendChild(pairs);
        
        const buttonsContainer = document.createElement("div");
        buttonsContainer.className = "buttons-container";
        buttonsContainer.appendChild(addPairBtn);
        buttonsContainer.appendChild(remPairBtn);
        
        wrapper.appendChild(buttonsContainer);
        container.appendChild(wrapper);
    }

    if (type === "fill") {
        container.innerHTML = `
            <div class="form-group">
                <label data-translate="quiz.sentenceWithBlanks">Sentence with blanks</label>
                <div class="input-with-image">
                    <textarea class="fill-sentence" data-translate-placeholder="quiz.sentencePlaceholder" placeholder="Enter the sentence that should have hidden words here" rows="3" oninput="updateBlanks(this)"></textarea>
                    <button class="image-upload-btn" onclick="handleImageUpload(this, 'fill')" data-translate-title="quiz.addImage" title="Add image">${getSVGIcon('image')}</button>
                </div>
                <div class="image-preview-container" id="fill-preview-${questionCount}"></div>
            </div>
            <div class="form-group">
                <label data-translate="quiz.fillOptions">Fill Options</label>
                <div class="fill-options-container">
                    <input type="text" class="fill-options-input" data-translate-placeholder="quiz.fillOptionsPlaceholder" placeholder="Enter options separated by commas and press Add">
                    <button class="add-fill-options-btn" onclick="addFillOptions(this)" data-translate-title="quiz.addFillOptions" title="Add Fill Options">${getSVGIcon('plus')}</button>
                </div>
                <div class="draggable-answers" id="draggable-answers-${questionCount}"></div>
            </div>
        `;
        
        setTimeout(() => {
            const sentenceTextarea = container.querySelector('.fill-sentence');
            if (sentenceTextarea) {
                setupTextareaAutoResize(sentenceTextarea);
            }
        }, 10);
    }
}
// Utility functions
function renumberQuestions() {
    document.querySelectorAll(".question-number").forEach((el, i) => {
        el.textContent = t('js.common.questionNumber', { number: i + 1 });
    });
}

function updateRemoveButtonsVisibility() {
    const allQuestions = document.querySelectorAll('.question-block');
    const removeButtons = document.querySelectorAll('.remove-btn');
    
    removeButtons.forEach(btn => {
        btn.style.display = allQuestions.length > 1 ? "block" : "none";
    });
}

function copyQuestion(sourceBlock) {
    const questionType = sourceBlock.querySelector('.question-type').value;
    const questionTextElement = sourceBlock.querySelector('.rich-text-input.question-text');
    const questionText = questionTextElement ? questionTextElement.innerHTML : '';
    
    addQuestion(sourceBlock);
    
    let newBlock = sourceBlock.nextElementSibling;
    if (!newBlock || !newBlock.classList.contains('question-block')) {
        const allBlocks = Array.from(document.querySelectorAll('.question-block'));
        const sourceIndex = allBlocks.indexOf(sourceBlock);
        newBlock = allBlocks[sourceIndex + 1];
    }
    
    if (!newBlock) {
        console.error('Could not find the newly created question block');
        return;
    }
    
    // Copy basic question properties
    newBlock.querySelector('.question-type').value = questionType;
    const newQuestionTextElement = newBlock.querySelector('.rich-text-input.question-text');
    if (newQuestionTextElement) {
        newQuestionTextElement.innerHTML = questionText;
        updatePlaceholder(newQuestionTextElement);
    }
    
    // Copy question images
    copyImages(sourceBlock, newBlock, '.image-preview-container');
    
    // Render content and copy specific data
    const typeSelect = newBlock.querySelector('.question-type');
    const contentBox = newBlock.querySelector('.question-content');
    typeSelect.onchange();
    
    // Copy type-specific content
    if (questionType === 'multiple') {
        copyMultipleChoiceAnswers(sourceBlock, newBlock);
    } else if (questionType === 'fill') {
        copyFillInBlank(sourceBlock, newBlock);
    } else if (questionType === 'matching') {
        copyMatchingPairs(sourceBlock, newBlock);
    }
}

function copyImages(sourceBlock, targetBlock, containerSelector) {
    const sourceContainer = sourceBlock.querySelector(containerSelector);
    const targetContainer = targetBlock.querySelector(containerSelector);
    
    if (sourceContainer && targetContainer) {
        const sourceImages = sourceContainer.querySelectorAll('img');
        sourceImages.forEach(sourceImg => {
            const previewWrapper = createImagePreviewWrapper(sourceImg.src, sourceImg.dataset.name || 'image');
            targetContainer.appendChild(previewWrapper);
        });
    }
}

function copyMultipleChoiceAnswers(sourceBlock, newBlock) {
    const sourceAnswers = sourceBlock.querySelectorAll('.answer-option');
    const answersGrid = newBlock.querySelector('.answers-grid');
    
    answersGrid.innerHTML = '';
    
    sourceAnswers.forEach(sourceOption => {
        const sourceInput = sourceOption.querySelector('.rich-text-input.answer-input');
        const sourceCorrectBtn = sourceOption.querySelector('.correct-answer-btn');
        
        const option = document.createElement("div");
        option.className = "answer-option";
        
        const inputContainer = document.createElement("div");
        inputContainer.className = "answer-input-container";
        
        const input = document.createElement("div");
        input.className = "rich-text-input answer-input";
        input.contentEditable = true;
        input.dataset.placeholder = "Answer option";
        input.setAttribute('data-translate-placeholder', 'quiz.answerPlaceholder');
        if (sourceInput) input.innerHTML = sourceInput.innerHTML;
        
        const uploadBtn = document.createElement("button");
        uploadBtn.className = "image-upload-btn small";
        uploadBtn.innerHTML = getSVGIcon('image');
        uploadBtn.title = "Add image";
        uploadBtn.setAttribute('data-translate-title', 'quiz.addImage');
        uploadBtn.onclick = () => handleImageUpload(uploadBtn, 'answer', option);
        
        inputContainer.appendChild(input);
        inputContainer.appendChild(uploadBtn);
        
        const correctBtn = document.createElement("button");
        correctBtn.className = "correct-answer-btn";
        correctBtn.innerHTML = getSVGIcon('check');
        if (sourceCorrectBtn?.classList.contains('selected')) {
            correctBtn.classList.add('selected');
        }
        correctBtn.onclick = () => {
            answersGrid.querySelectorAll('.correct-answer-btn').forEach(btn => btn.classList.remove('selected'));
            correctBtn.classList.add('selected');
        };
        
        const removeBtn = document.createElement("button");
        removeBtn.className = "remove-option-btn";
        removeBtn.innerHTML = getSVGIcon('close');
        removeBtn.onclick = () => option.remove();
        
        const previewContainer = document.createElement("div");
        previewContainer.className = "image-preview-container small";
        
        // Copy option images
        copyImages(sourceOption, option, '.image-preview-container');
        
        option.appendChild(inputContainer);
        option.appendChild(correctBtn);
        option.appendChild(removeBtn);
        option.appendChild(previewContainer);
        answersGrid.appendChild(option);
    });
}

function copyFillInBlank(sourceBlock, newBlock) {
    const sourceSentence = sourceBlock.querySelector('.fill-sentence');
    const sourceOptions = sourceBlock.querySelectorAll('.fill-option-chip .option-text');
    const newSentence = newBlock.querySelector('.fill-sentence');
    const newOptionsList = newBlock.querySelector('.fill-options-list');
    const newOptionsContainer = newBlock.querySelector('.fill-options-container');
    
    if (sourceSentence && newSentence) newSentence.value = sourceSentence.value;
    
    if (sourceOptions && newOptionsList) {
        newOptionsList.innerHTML = '';
        sourceOptions.forEach(option => {
            const optionText = option.textContent;
            const optionChip = document.createElement('div');
            optionChip.className = 'fill-option-chip';
            optionChip.innerHTML = `
                <span class="option-text">${optionText}</span>
                <button class="remove-option-btn" onclick="this.parentElement.remove()">×</button>
            `;
            newOptionsList.appendChild(optionChip);
        });
        // Maintain consistent DOM structure
        newOptionsContainer.appendChild(newOptionsList);
    }
}

function copyMatchingPairs(sourceBlock, newBlock) {
    const sourceRows = sourceBlock.querySelectorAll('.matching-row');
    const newPairsContainer = newBlock.querySelector('.matching-pairs-container');
    
    newPairsContainer.innerHTML = '';
    
    sourceRows.forEach(sourceRow => {
        const sourceLeftElement = sourceRow.querySelector('.rich-text-input.matching-left');
        const sourceRightElement = sourceRow.querySelector('.rich-text-input.matching-right');
        const leftItem = sourceLeftElement ? sourceLeftElement.innerHTML : '';
        const rightItem = sourceRightElement ? sourceRightElement.innerHTML : '';
        
        // Add a new pair and set its content
        const addPairBtn = newBlock.querySelector('.add-pair-btn');
        if (addPairBtn) {
            addPairBtn.click();
            const newRow = newPairsContainer.lastElementChild;
            if (newRow) {
                const newLeft = newRow.querySelector('.rich-text-input.matching-left');
                const newRight = newRow.querySelector('.rich-text-input.matching-right');
                if (newLeft) newLeft.innerHTML = leftItem;
                if (newRight) newRight.innerHTML = rightItem;
                
                // Copy images for this pair
                copyImages(sourceRow, newRow, '.image-preview-container');
            }
        }
    });
}

function runTest() {
    console.log('runTest() called');
    
    try {
        // Clear any previous validation styling
        clearValidationStyling();
        
        // Collect test data from form
        const testData = collectTestData();
        console.log('Test data collected:', testData);
        console.log('Test data questions count:', testData?.questions?.length);
        
        if (!testData || testData.questions.length === 0) {
            alert('Please add at least one question before running test.');
            return;
        }
        
        // Validate multiple choice questions have correct answers
        const validationErrors = validateMultipleChoiceQuestions(testData);
        
        if (validationErrors.length > 0) {
            // Highlight invalid questions with red borders
            highlightInvalidQuestions(validationErrors);
            
            // Scroll to first invalid question
            scrollToFirstInvalidQuestion(validationErrors);
            
            // Show error message
            const errorMessage = `Cannot run test: ${validationErrors.length} multiple choice question(s) missing correct answer. Please select a correct answer for each highlighted question.`;
            showNotificationModal(t('modal.validation.title'), t('modal.validation.missingAnswers'), 'error');
            return;
        }
        
        // Save test data to sessionStorage for test runner
        sessionStorage.setItem('testData', JSON.stringify(testData));
        console.log('Test data saved to sessionStorage, size:', JSON.stringify(testData).length);
        console.log('SessionStorage contents:', sessionStorage.getItem('testData'));
        
        // Open test runner in a new window
        const newWindow = window.open('test-runner.html', '_blank');
        console.log('Opening test runner window:', newWindow);
        
        if (!newWindow) {
            alert('Popup blocked! Please allow popups for this site and try again.');
        }
    } catch (error) {
        console.error('Error in runTest():', error);
        alert('Error: ' + error.message);
    }
}

function generateQuizId() {
    return 'quiz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Generate unique title for tests
async function generateUniqueTitle() {
    // Check if Supabase client is available
    if (!window.supabaseClient) {
        return 'test_' + Date.now(); // Fallback title
    }
    
    const savedQuizzes = await window.loadQuizzesFromSupabase();
    const baseTitle = 'test';
    let counter = 1;
    let uniqueTitle = baseTitle;
    
    // Check if base title exists, then increment counter
    while (savedQuizzes.some(quiz => quiz.title === uniqueTitle)) {
        uniqueTitle = `${baseTitle}(${counter})`;
        counter++;
    }
    
    return uniqueTitle;
}
function goToSavedQuizzes() {
    window.location.href = 'saved-quizzes.html';
}

async function saveQuiz() {
    console.log('saveQuiz() called');

    const saveBtn = document.querySelector('.btn-save');
    const originalText = saveBtn ? saveBtn.textContent : 'Save Quiz';

    try {
        // Check if Supabase client is available
        if (!window.supabaseClient) {
            showNotificationModal(t('modal.error'), t('modal.supabaseNotInitialized'), 'error');
            return;
        }

        // Show subtle notification instead of button loading
        showSubtleNotification('Saving quiz...', 'info');

        // Collect test data from form
        const testData = collectTestData();
        console.log('Test data collected:', testData);

        if (!testData || testData.questions.length === 0) {
            showNotificationModal(t('modal.cannotSave'), t('modal.noQuestions'), 'warning');
            return;
        }

        // Generate automatic title if user didn't provide one
        if (!testData.title || testData.title.trim() === '' || testData.title === 'Test') {
            testData.title = await generateUniqueTitle();
        }

        // Set the current editing ID if we're editing
        if (currentEditingQuizId) {
            testData.id = currentEditingQuizId;
        }

        // Save to Supabase
        const result = await window.saveQuizToSupabase(testData);

        if (result.success) {
            console.log('Quiz saved to Supabase');

            // Clear autosave only for new quizzes (when we didn't have an ID before)
            if (!currentEditingQuizId) {
                await window.clearAutosaveFromSupabase();
                console.log('Autosave cleared after manual save');
            }

            // Update current editing ID
            currentEditingQuizId = result.data.id;

            // Update URL to include the quiz ID
            const newUrl = `${window.location.origin}${window.location.pathname}?id=${result.data.id}`;
            window.history.replaceState({}, '', newUrl);

            // Show success notification in notification area
            const message = testData.id && testData.id !== currentEditingQuizId ? 'Quiz updated successfully!' : 'Quiz saved successfully!';
            showSubtleNotification(message, 'success');
        } else {
            console.error('Error saving quiz:', result.error);
            showSubtleNotification('Save failed: ' + result.error, 'error');
        }

    } catch (error) {
        console.error('Error in saveQuiz:', error);
        showSubtleNotification('Unexpected error: ' + error.message, 'error');
    }
}

function collectTestData() {
    console.log('collectTestData() called');

    // ... (rest of the code remains the same)
    const title = document.getElementById('testTitle').value || 'Test';
    const instructions = document.getElementById('instructions').value || 'Answer the following questions to the best of your ability.';
    
    console.log('Title:', title);
    console.log('Instructions:', instructions);
    
    const questions = [];
    const questionBlocks = document.querySelectorAll('.question-block');
    
    console.log('Found question blocks:', questionBlocks.length);
    
    questionBlocks.forEach((block, blockIndex) => {
        const questionType = block.querySelector('.question-type').value;
        const questionTextElement = block.querySelector('.rich-text-input.question-text');
        const questionText = questionTextElement ? questionTextElement.innerHTML.trim() : '';
        
        if (!questionText || (!questionText.trim() && !questionTextElement.querySelector('img'))) return; // Skip empty questions
        
        const question = {
            type: questionType,
            question: questionText
        };
        
        // Collect question images
        const questionPreview = block.querySelector('.image-preview-container');
        if (questionPreview) {
            const images = questionPreview.querySelectorAll('img');
            if (images.length > 0) {
                question.images = Array.from(images).map(img => ({
                    src: img.src,
                    name: img.dataset.name || 'image'
                }));
            }
        }
        
        if (questionType === 'multiple') {
            const options = [];
            const correctAnswer = block.querySelector('.correct-answer-btn.selected');
            let correctIndex = -1;
            
            block.querySelectorAll('.answer-option').forEach((option, index) => {
                const input = option.querySelector('.rich-text-input.answer-input');
                if (input && (input.innerHTML.trim() || input.querySelector('img'))) {
                    const optionData = {
                        text: input.innerHTML.trim()
                    };
                    
                    // Collect option images
                    const optionPreview = option.querySelector('.image-preview-container');
                    if (optionPreview) {
                        const images = optionPreview.querySelectorAll('img');
                        if (images.length > 0) {
                            optionData.images = Array.from(images).map(img => ({
                                src: img.src,
                                name: img.dataset.name || 'image'
                            }));
                        }
                    }
                    
                    options.push(optionData);
                    if (option.querySelector('.correct-answer-btn.selected')) {
                        correctIndex = index;
                    }
                }
            });
            
            if (options.length > 0) {
                question.options = options;
                if (correctIndex !== -1) {
                    question.correctAnswer = correctIndex;
                }
                questions.push(question);
            }
        } else if (questionType === 'fill') {
            const sentence = block.querySelector('.fill-sentence').value;
            
            // Try to get options text - handle both cases: with and without nested span
            const optionChips = block.querySelectorAll('.fill-option-chip');
            
            const options = Array.from(optionChips).map((chip, index) => {
                
                // First try to find nested span (when loading saved data)
                const optionTextSpan = chip.querySelector('.option-text');
                if (optionTextSpan) {
                    const text = optionTextSpan.textContent.trim();
                    return text;
                }
                // Fallback to direct textContent (when creating new options)
                const text = chip.textContent.trim().replace('×', '').trim(); // Remove × button text
                return text;
            }).filter(opt => opt && opt.trim() !== '' && opt !== '×'); // Filter out empty options and button text
            
            // Always include fill-in-the-blank questions, even without options
            question.sentence = sentence;
            question.options = options;
            questions.push(question);
        } else if (questionType === 'typing') {
            // Typing questions are now included in the test
            question.type = 'typing';
            questions.push(question);
            // Skip adding typing questions to the questions array
        } else if (questionType === 'matching') {
            const pairs = [];
            block.querySelectorAll('.matching-row').forEach(row => {
                const leftElement = row.querySelector('.rich-text-input.matching-left');
                const rightElement = row.querySelector('.rich-text-input.matching-right');
                const leftItem = leftElement ? leftElement.innerHTML.trim() : '';
                const rightItem = rightElement ? rightElement.innerHTML.trim() : '';
                
                const pairData = {};
                
                if (leftItem) pairData.left = leftItem;
                if (rightItem) pairData.right = rightItem;
                
                // Collect left side images
                const leftPreviewContainer = row.querySelectorAll('.image-preview-container')[0];
                if (leftPreviewContainer) {
                    const leftImages = leftPreviewContainer.querySelectorAll('img');
                    if (leftImages.length > 0) {
                        pairData.leftImages = Array.from(leftImages).map(img => ({
                            src: img.src,
                            name: img.dataset.name || 'image'
                        }));
                    }
                }
                
                // Collect right side images
                const rightPreviewContainer = row.querySelectorAll('.image-preview-container')[1];
                if (rightPreviewContainer) {
                    const rightImages = rightPreviewContainer.querySelectorAll('img');
                    if (rightImages.length > 0) {
                        pairData.rightImages = Array.from(rightImages).map(img => ({
                            src: img.src,
                            name: img.dataset.name || 'image'
                        }));
                    }
                }
                
                if (leftItem || rightItem || pairData.leftImages || pairData.rightImages) {
                    pairs.push(pairData);
                }
            });
            
            if (pairs.length > 0) {
                question.pairs = pairs;
                questions.push(question);
            }
        }
    });
    
    console.log('Final questions array:', questions);
    
    const result = {
        title: title,
        instructions: instructions,
        questions: questions
    };
    console.log('Returning test data:', result);
    return result;
}

// Image upload handling function
function handleImageUpload(button, type, optionElement = null) {
    // Create a hidden file input
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    
    // Add the file input to the DOM
    document.body.appendChild(fileInput);
    
    // Handle file selection
    fileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotificationModal('Invalid File', 'Please select an image file.', 'error');
                return;
            }
            
            // Validate file size (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB in bytes
            if (file.size > maxSize) {
                showNotificationModal('File Too Large', 'Please select an image smaller than 5MB.', 'error');
                return;
            }
            
            try {
                // Show loading indicator
                const originalButtonText = button.innerHTML;
                console.log('Starting upload, original button content:', originalButtonText);
                button.innerHTML = '<div class="loading-spinner"></div>';
                button.disabled = true;
                console.log('Button updated with loading spinner');
                
                // Upload directly to Supabase Storage
                const uploadResult = await window.uploadImageToSupabase(file, 'temp');
                console.log('Upload result:', uploadResult);
                
                if (uploadResult.success) {
                    // Display the image preview with storage URL
                    displayImagePreview(uploadResult.url, button, type, file.name, optionElement);
                    
                    // Trigger autosave if applicable
                    triggerAutosave();
                } else {
                    showNotificationModal('Upload Error', 'Failed to upload image: ' + uploadResult.error, 'error');
                }
            } catch (error) {
                console.error('Upload error:', error);
                showNotificationModal('Upload Error', 'Failed to upload image. Please try again.', 'error');
            } finally {
                // Restore button
                console.log('Restoring button state');
                button.innerHTML = originalButtonText;
                button.disabled = false;
                console.log('Button state restored');
            }
        }
        
        // Remove the file input from DOM
        document.body.removeChild(fileInput);
    });
    
    // Trigger the file selection dialog
    fileInput.click();
}

function displayImagePreview(imageData, button, type, fileName, optionElement = null) {
    let targetElement;

    if (type === 'question') {
        // For question images, find the rich text input in the same question block
        const questionBlock = button.closest('.question-block');
        targetElement = questionBlock.querySelector('.rich-text-input.question-text');

        if (targetElement) {
            // Insert image at cursor position or at the end
            insertImageAtCursor(targetElement, imageData, fileName);
        }
    } else if (type === 'answer') {
        // For answer images, find the rich text input in the same option
        targetElement = optionElement.querySelector('.rich-text-input.answer-input');

        if (targetElement) {
            // Insert image at cursor position or at the end
            insertImageAtCursor(targetElement, imageData, fileName);
        }
    } else if (type === 'typing') {
        // For typing questions, find the rich text input in the same question block
        const questionBlock = button.closest('.question-block');
        targetElement = questionBlock.querySelector('.rich-text-input.typing-answer');

        if (targetElement) {
            // Insert image at cursor position or at the end
            insertImageAtCursor(targetElement, imageData, fileName);
        }
    } else if (type === 'fill') {
        // For fill-in-the-blank questions, find the preview container
        const questionBlock = button.closest('.question-block');
        const previewContainer = questionBlock.querySelector('.image-preview-container[id^="fill-preview-"]');

        if (previewContainer) {
            // Create preview wrapper with delete functionality
            const previewWrapper = createImagePreviewWrapper(imageData, fileName);
            previewContainer.appendChild(previewWrapper);
        }
    } else if (type === 'matching-left') {
        // For matching left side, find the rich text input
        const matchingRow = optionElement;
        targetElement = matchingRow.querySelector('.rich-text-input.matching-left');

        if (targetElement) {
            // Insert image at cursor position or at the end
            insertImageAtCursor(targetElement, imageData, fileName);
        }
    } else if (type === 'matching-right') {
        // For matching right side, find the rich text input
        const matchingRow = optionElement;
        targetElement = matchingRow.querySelector('.rich-text-input.matching-right');

        if (targetElement) {
            // Insert image at cursor position or at the end
            insertImageAtCursor(targetElement, imageData, fileName);
        }
    }
}

// Helper function to create image preview wrapper with delete overlay
function createImagePreviewWrapper(imageData, fileName) {
    const previewWrapper = document.createElement('div');
    previewWrapper.className = 'image-preview-wrapper';

    const img = document.createElement('img');
    img.src = imageData;
    img.dataset.name = fileName;
    img.className = 'preview-image';

    // Create delete overlay with bucket icon
    const deleteOverlay = document.createElement('div');
    deleteOverlay.className = 'image-delete-overlay';
    deleteOverlay.innerHTML = getBucketSVG();

    // Make entire wrapper clickable for deletion
    previewWrapper.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Add confirmation for better UX
        if (confirm('Delete this image?')) {
            previewWrapper.remove();
            triggerAutosave();
        }
    };

    previewWrapper.appendChild(img);
    previewWrapper.appendChild(deleteOverlay);

    return previewWrapper;
}

// Helper function to get bucket/trash SVG icon
function getBucketSVG() {
    return `<svg xmlns="http://www.w3.org/2000/svg" height="32px" viewBox="0 -960 960 960" width="32px" fill="white">
        <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/>
    </svg>`;
}

function insertImageAtCursor(element, imageData, fileName) {
    // Check if there's already an image in this element
    const existingImage = element.querySelector('img.inline-image');
    if (existingImage) {
        alert('Only one image is allowed per input field. Please remove the existing image first.');
        return;
    }
    
    // Focus the element
    element.focus();
    
    // Create the image element
    const img = document.createElement('img');
    img.src = imageData;
    img.dataset.name = fileName;
    img.className = 'inline-image';
    img.contentEditable = false;
    img.draggable = false;
    
    // Create delete overlay for inline image
    const deleteOverlay = document.createElement('div');
    deleteOverlay.className = 'inline-image-delete-overlay';
    deleteOverlay.innerHTML = getBucketSVG();
    deleteOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
        border-radius: 4px;
    `;
    
    // Create wrapper for image and overlay
    const imageWrapper = document.createElement('span');
    imageWrapper.style.cssText = `
        position: relative;
        display: inline-block;
        cursor: pointer;
    `;
    
    // Add hover effect to show/hide delete overlay
    imageWrapper.addEventListener('mouseenter', () => {
        deleteOverlay.style.opacity = '1';
        img.style.filter = 'brightness(0.5)';
    });
    
    imageWrapper.addEventListener('mouseleave', () => {
        deleteOverlay.style.opacity = '0';
        img.style.filter = 'brightness(1)';
    });
    
    // Add click handler to remove image
    imageWrapper.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (confirm('Delete this image?')) {
            imageWrapper.remove();
            updatePlaceholder(element);
            triggerAutosave();
        }
    });
    
    imageWrapper.appendChild(img);
    imageWrapper.appendChild(deleteOverlay);
    
    // Get current selection
    const selection = window.getSelection();
    const range = selection.getRangeAt(0);
    
    // Insert image wrapper at cursor position
    range.deleteContents();
    range.insertNode(imageWrapper);
    
    // Move cursor after the image wrapper
    range.setStartAfter(imageWrapper);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Add a space after the image
    const space = document.createTextNode(' ');
    range.insertNode(space);
    
    // Update any placeholder behavior
    updatePlaceholder(element);
}

// Validation functions for runTest
function validateMultipleChoiceQuestions(testData) {
    const validationErrors = [];
    
    testData.questions.forEach((question, questionIndex) => {
        if (question.type === 'multiple') {
            // Check if question has a correct answer
            if (question.correctAnswer === undefined || question.correctAnswer === -1) {
                validationErrors.push({
                    questionIndex: questionIndex,
                    questionText: question.question.substring(0, 50) + (question.question.length > 50 ? '...' : ''),
                    blockIndex: questionIndex
                });
            }
        }
    });
    
    return validationErrors;
}

function clearValidationStyling() {
    // Remove red border styling from all question blocks
    document.querySelectorAll('.question-block').forEach(block => {
        block.classList.remove('validation-error');
        block.style.border = '';
        block.style.boxShadow = '';
    });
}

function highlightInvalidQuestions(validationErrors) {
    validationErrors.forEach(error => {
        const questionBlocks = document.querySelectorAll('.question-block');
        if (questionBlocks[error.blockIndex]) {
            const block = questionBlocks[error.blockIndex];
            block.classList.add('validation-error');
            
            // Add red border styling
            block.style.border = '2px solid #e74c3c';
            block.style.boxShadow = '0 0 10px rgba(231, 76, 60, 0.3)';
            
            // Add event listeners to clear validation when user interacts with the question
            addValidationClearListeners(block);
        }
    });
}

function addValidationClearListeners(block) {
    // Clear validation when user clicks on correct answer buttons
    const correctBtns = block.querySelectorAll('.correct-answer-btn');
    correctBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            clearValidationStyling();
        });
    });
    
    // Clear validation when user changes question type
    const typeSelect = block.querySelector('.question-type');
    if (typeSelect) {
        typeSelect.addEventListener('change', () => {
            clearValidationStyling();
        });
    }
}

function scrollToFirstInvalidQuestion(validationErrors) {
    if (validationErrors.length === 0) return;
    
    const questionBlocks = document.querySelectorAll('.question-block');
    const firstError = validationErrors[0];
    
    if (questionBlocks[firstError.blockIndex]) {
        const block = questionBlocks[firstError.blockIndex];
        
        // Scroll block into view
        block.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });
        
        // Add a brief highlight effect
        block.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            block.style.transform = 'scale(1.02)';
            setTimeout(() => {
                block.style.transform = 'scale(1)';
            }, 200);
        }, 300);
    }
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

function openProfileSettings() {
    // Close the dropdown
    const dropdown = document.getElementById('profileDropdown');
    const selector = document.querySelector('.profile-selector');
    dropdown.classList.remove('show');
    selector.classList.remove('active');
    
    // Navigate to profile settings page
    window.location.href = 'profile-settings.html';
}

function logout() {
    // Close the dropdown if open
    const dropdown = document.getElementById('profileDropdown');
    const selector = document.querySelector('.profile-selector');
    if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
        selector.classList.remove('active');
    }
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

// Language change function
function changeLanguage(lang) {
    if (window.languageManager) {
        window.languageManager.setLanguage(lang);
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