// SVG Icon Helper Function

function getSVGIcon(iconName, size = 16) {

    const icons = {

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
    if (!element || typeof element.querySelector !== 'function') return;

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

            titleCounter.style.color = currentLength >= 30 ? 'black' : 

                                     currentLength >= 25 ? 'black' : 'black';

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

        const autosaveData = await window.loadAutosaveFromSupabase('single');

        

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



// Save quiz and redirect to saved quizzes page

async function saveAndGoHome() {

    await saveQuiz();

    // Wait a moment for save to complete

    setTimeout(() => {

        window.location.href = 'saved-quizzes.html';

    }, 500);

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

            background: black;

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

            background: black;

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

let placeholder = null;

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

                window.history.replaceState({}, '', `?id=${quizId}`);

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

    const questionText = questionData.question ?? questionData.text ?? questionData.prompt ?? '';
    if (questionTextElement && questionText) {

        questionTextElement.innerHTML = questionText;

        updatePlaceholder(questionTextElement);

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

    const correctAnswerIndex = Number(questionData.correctAnswer);
    const hasValidCorrectAnswer = Number.isFinite(correctAnswerIndex) && correctAnswerIndex >= 0;

    

    if (questionData.options && questionData.options.length > 0) {

        questionData.options.forEach((optionData, index) => {

            addAnswer(answersGrid);

            const lastOption = answersGrid.lastElementChild;

            

            // Set option text

            const input = lastOption.querySelector('.rich-text-input.answer-input');

            const optionText = optionData?.text ?? optionData?.answer ?? optionData?.value ?? optionData ?? '';
            if (input && optionText) {

                input.innerHTML = optionText;

                updatePlaceholder(input);

            }



            // Set correct answer

            if (hasValidCorrectAnswer && correctAnswerIndex === index) {

                const correctBtn = lastOption.querySelector('.correct-answer-btn');

                if (correctBtn) {
                    correctBtn.classList.add('selected', 'bg-primary', 'text-on-primary', 'border-primary');
                    correctBtn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant', 'border-outline-variant/20');
                }

            }

            

            
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

                    

                    
                }

            }

        });

    }

}



// Pointer-based drag and drop functionality

const container = document.getElementById('questionsContainer');



let offsetY = 0;

let originalLeft = 0;

let originalWidth = 0;

let originalTop = 0;

let currentY = 0;

let targetY = 0;

let animationFrame = null;

let isDragging = false;

let currentPointerY = 0;

let currentPointerX = 0;

let autoScrollAnimation = null;

let scrollVelocity = 0;

let scrollZoneTop = 120;

let scrollZoneBottom = 120;

let isAutoScrolling = false;



function initializeDragAndDrop(block) {

    const dragHandle = block.querySelector('.drag-handle');

    

    dragHandle.addEventListener('pointerdown', handlePointerDown);

}



function handlePointerDown(e) {

    const handle = e.target.closest('.drag-handle');

    if (!handle) return;



    e.preventDefault();

    handle.setPointerCapture(e.pointerId);



    draggedElement = handle.closest('.question-block');

    const rect = draggedElement.getBoundingClientRect();

    const containerRect = container.getBoundingClientRect();



    // Use reliable client coordinates

    offsetY = e.clientY - rect.top;

    originalLeft = rect.left;

    originalTop = rect.top;

    originalWidth = rect.width;

    isDragging = true;



    // Initialize animation variables

    currentY = rect.top;

    targetY = currentY;

    currentPointerY = e.clientY;

    currentPointerX = e.clientX;



    // Create styled placeholder

    placeholder = document.createElement('div');

    placeholder.style.height = rect.height + 'px';

    placeholder.style.width = rect.width + 'px';

    placeholder.style.margin = window.getComputedStyle(draggedElement).margin;

    placeholder.classList.add('placeholder');



    container.insertBefore(placeholder, draggedElement);



    // Set proper dragging styles

    draggedElement.classList.add('dragging');

    draggedElement.style.position = 'fixed';

    draggedElement.style.left = originalLeft + 'px';

    draggedElement.style.top = originalTop + 'px';

    draggedElement.style.width = originalWidth + 'px';

    draggedElement.style.zIndex = '1000';

    draggedElement.style.pointerEvents = 'none';

    

    // Start animations

    animationFrame = requestAnimationFrame(animate);

    startAutoScroll();



    document.body.classList.add('dragging');



    document.addEventListener('pointermove', handlePointerMove);

    document.addEventListener('pointerup', handlePointerUp);

}



function handlePointerMove(e) {

    if (!draggedElement || !isDragging) return;



    // Store latest pointer position for continuous tracking

    currentPointerY = e.clientY;

    currentPointerX = e.clientX;



    // Update target position using current pointer coordinates

    targetY = currentPointerY - offsetY;



    // Update scroll velocity based on current pointer position

    updateScrollVelocity();



    const blocks = [...container.querySelectorAll('.question-block:not(.dragging)')];



    let insertBefore = null;



    for (const block of blocks) {

        const rect = block.getBoundingClientRect();

        const middle = rect.top + rect.height / 2;



        if (currentPointerY < middle) {

            insertBefore = block;

            break;

        }

    }



    if (insertBefore) {

        container.insertBefore(placeholder, insertBefore);

    } else {

        container.appendChild(placeholder);

    }

}



function handlePointerUp(e) {

    if (!draggedElement || !isDragging) return;



    isDragging = false;



    // Stop drag animation

    if (animationFrame) {

        cancelAnimationFrame(animationFrame);

        animationFrame = null;

    }



    // Stop auto-scroll animation

    stopAutoScroll();



    // Release pointer capture

    const handle = draggedElement.querySelector('.drag-handle');

    if (handle) {

        handle.releasePointerCapture(e.pointerId);

    }



    // Insert dragged element at placeholder position

    container.insertBefore(draggedElement, placeholder);

    placeholder.remove();

    placeholder = null;



    // Fully restore original styles

    draggedElement.classList.remove('dragging');

    draggedElement.style.position = '';

    draggedElement.style.left = '';

    draggedElement.style.top = '';

    draggedElement.style.width = '';

    draggedElement.style.zIndex = '';

    draggedElement.style.pointerEvents = '';



    document.body.classList.remove('dragging');



    // Safely remove listeners

    document.removeEventListener('pointermove', handlePointerMove);

    document.removeEventListener('pointerup', handlePointerUp);



    // Renumber questions and trigger autosave after reordering

    renumberQuestions();

    triggerAutosave();



    draggedElement = null;

}



// Smooth animation function

function animate() {

    if (!draggedElement || !isDragging) return;



    // Recalculate position from current pointer coordinates every frame

    // This ensures the dragged element stays attached to cursor during scroll

    const currentTargetY = currentPointerY - offsetY;

    

    // Smooth lerp animation with early stop for tiny movements

    const diff = currentTargetY - currentY;

    if (Math.abs(diff) < 0.5) {

        currentY = currentTargetY;

        draggedElement.style.top = currentY + 'px';

        draggedElement.style.left = originalLeft + 'px';

    } else {

        currentY += diff * 0.15;

        draggedElement.style.top = currentY + 'px';

        draggedElement.style.left = originalLeft + 'px';

    }



    animationFrame = requestAnimationFrame(animate);

}



// Auto-scroll functions

function startAutoScroll() {

    if (isAutoScrolling) return;

    isAutoScrolling = true;

    autoScrollAnimation = requestAnimationFrame(performAutoScroll);

}

function stopAutoScroll() {

    isAutoScrolling = false;

    scrollVelocity = 0;



    if (autoScrollAnimation) {

        cancelAnimationFrame(autoScrollAnimation);

        autoScrollAnimation = null;

    }

}

function updateScrollVelocity() {

    if (!isDragging) {

        scrollVelocity = 0;

        return;

    }

    const maxSpeed = 6; // Maximum scroll speed

    const accelerationZone = 50; // Distance from edge where acceleration starts



    // Calculate velocity based on distance to edges

    if (currentPointerY < scrollZoneTop) {

        // Top zone - scroll up

        const distance = Math.max(0, scrollZoneTop - currentPointerY);

        const intensity = Math.min(1, distance / accelerationZone);

        scrollVelocity = -maxSpeed * Math.pow(intensity, 1.2); // Smooth acceleration curve

    } else if (currentPointerY > window.innerHeight - scrollZoneBottom) {

        // Bottom zone - scroll down

        const distance = Math.max(0, currentPointerY - (window.innerHeight - scrollZoneBottom));

        const intensity = Math.min(1, distance / accelerationZone);

        scrollVelocity = maxSpeed * Math.pow(intensity, 1.2); // Smooth acceleration curve

    } else {

        // Outside scroll zones

        scrollVelocity = 0;

    }

}

function performAutoScroll() {

    if (!isAutoScrolling || !isDragging) {

        scrollVelocity = 0;

        return;

    }

    // Apply continuous scrolling

    if (Math.abs(scrollVelocity) > 0.1) {

        window.scrollBy(0, scrollVelocity);

    }

    // Continue auto-scroll animation loop

    autoScrollAnimation = requestAnimationFrame(performAutoScroll);

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

    const block = document.createElement("section");

    block.className = "question-block bg-surface-container-lowest rounded-[2rem] p-8 shadow-sm border border-outline-variant/15 relative group overflow-hidden mb-6";

    

    block.innerHTML = `

        <div class="absolute top-0 left-0 w-2 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></div>

        <div class="flex justify-between items-start mb-6">

            <div class="flex items-center gap-3">

                <span class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">${questionCount}</span>

                <h3 class="font-headline font-semibold text-lg text-on-surface">Question ${questionCount}</h3>

                <div class="typing-warning-indicator w-5 h-5 bg-tertiary rounded-full text-white text-xs font-bold cursor-default hidden items-center justify-center ml-2 relative" onmouseenter="showTooltip(this)" onmouseleave="hideTooltip(this)" data-translate="quiz.typingWarning">!

                    <div class="custom-tooltip absolute bottom-6 left-0 bg-white text-black p-2 rounded text-xs whitespace-nowrap z-50 hidden pointer-events-none shadow-lg border border-outline-variant/20" data-translate="quiz.typingWarningTooltip">This question type will be included in PDF but ignored by test runner</div>

                </div>

            </div>

            <div class="flex gap-2">

                <div class="drag-handle p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors cursor-move">

                    <span class="material-symbols-outlined">drag_handle</span>

                </div>

                <button class="copy-btn p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">

                    <span class="material-symbols-outlined">content_copy</span>

                </button>

                <button class="remove-btn p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">

                    <span class="material-symbols-outlined">delete</span>

                </button>

            </div>

        </div>

        <div class="mb-6">

            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.questionType">Question Type</label>

            <div class="relative">

                <select class="question-type w-full bg-surface-container-highest border-none rounded-xl text-sm p-3 focus:ring-2 focus:ring-primary/20 appearance-none cursor-pointer">

                    <option value="multiple" data-translate="quiz.multipleChoice">Multiple Choice</option>

                    <option value="typing" data-translate="quiz.typingAnswer">Typing Answer</option>

                    <option value="fill" data-translate="quiz.fillBlank">Fill in the Blank</option>

                    <option value="matching" data-translate="quiz.matching">Matching</option>

                </select>

                <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">

                    <span class="material-symbols-outlined text-on-surface-variant">arrow_drop_down</span>

                </div>

            </div>

        </div>

        <div class="mb-8">

            <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.questionText">Question Text</label>

            <div class="rich-text-input question-text w-full bg-surface-container-highest border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 min-h-[80px]" contenteditable="true" data-translate-placeholder="quiz.questionPlaceholder" data-placeholder="Enter your question here..."></div>

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

    option.className = "answer-option bg-transparent border border-outline-variant/10 rounded-lg p-3 flex items-center gap-2 transition-all hover:border-outline-variant/20 group";

    

    const inputContainer = document.createElement("div");

    inputContainer.className = "answer-input-container flex-1";

    

    const input = document.createElement("div");

    input.className = "rich-text-input answer-input w-full bg-surface-container-highest border border-outline-variant/10 rounded-md p-2 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 min-h-[36px] transition-all hover:border-outline-variant/20 text-sm";

    input.contentEditable = true;

    input.dataset.placeholder = "Answer option";

    input.setAttribute('data-translate-placeholder', 'quiz.answerPlaceholder');

    

    inputContainer.appendChild(input);

    

    const correctBtn = document.createElement("button");

    correctBtn.className = "correct-answer-btn w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant transition-all hover:bg-primary/10 hover:border-primary/30 hover:text-primary group-hover:border-primary/20 flex-shrink-0";

    correctBtn.innerHTML = getSVGIcon('check', 14);

    correctBtn.onclick = () => {

        grid.querySelectorAll('.correct-answer-btn').forEach(btn => {

            btn.classList.remove('selected', 'bg-primary', 'text-on-primary', 'border-primary');

            btn.classList.add('bg-surface-container-highest', 'text-on-surface-variant', 'border-outline-variant/20');

        });

        correctBtn.classList.add('selected', 'bg-primary', 'text-on-primary', 'border-primary');

        correctBtn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant', 'border-outline-variant/20');

        triggerAutosave(); // Trigger autosave when correct answer changes

    };

    

    const removeBtn = document.createElement("button");

    removeBtn.className = "remove-option-btn w-6 h-6 rounded-full bg-error/10 text-error flex items-center justify-center transition-all hover:bg-error hover:text-on-primary opacity-0 group-hover:opacity-100 flex-shrink-0";

    removeBtn.innerHTML = getSVGIcon('close', 12);

    removeBtn.onclick = () => option.remove();

    

    option.appendChild(inputContainer);

    option.appendChild(correctBtn);

    option.appendChild(removeBtn);

    grid.appendChild(option);

}



// Fill options management

function addFillOptions(button) {

    const container = button.closest('.options-group');

    const input = container.querySelector('.fill-options-input');

    const draggableAnswers = container.querySelector('.draggable-answers');

    

    if (!input || !draggableAnswers) return;

    

    const optionsText = input.value.trim();

    if (!optionsText) return;

    

    const options = optionsText.split(',').map(opt => opt.trim()).filter(opt => opt);

    

    const sentence = container.closest('.fill-container').querySelector('.fill-sentence').value;

    

    // Get or create the options container

    let optionsContainer = draggableAnswers.querySelector('.fill-options-list');

    if (!optionsContainer) {

        optionsContainer = document.createElement('div');

        optionsContainer.className = 'fill-options-list flex flex-wrap gap-2';

        draggableAnswers.appendChild(optionsContainer);

    }

    

    options.forEach(optionText => {

        const optionChip = document.createElement('div');

        optionChip.className = 'fill-option-chip bg-surface-container-highest border border-outline-variant/15 rounded-lg px-3 py-2 flex items-center gap-2 transition-all hover:border-outline-variant/30 group cursor-pointer';

        optionChip.dataset.answer = optionText;

        

        // Check if option exists as a complete word in sentence

        // Create regex to match exact word with word boundaries, including punctuation

        const wordRegex = new RegExp(`(?:^|\\s)${optionText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=\\s|[.,!?;:()[\]{}"']|$)`, 'i');

        const existsInSentence = wordRegex.test(sentence);

        

        if (existsInSentence) {

            optionChip.classList.add('bg-primary/10', 'border-primary/30', 'text-primary');

            optionChip.dataset.isCorrect = 'true';

        } else {

            optionChip.dataset.isCorrect = 'false';

        }

        

        // Create consistent structure with nested span for text

        const optionTextSpan = document.createElement('span');

        optionTextSpan.className = 'option-text text-sm font-medium';

        optionTextSpan.textContent = optionText;

        

        const removeBtn = document.createElement('button');

        removeBtn.className = 'remove-option-btn w-5 h-5 rounded-full bg-error/10 text-error flex items-center justify-center transition-all hover:bg-error hover:text-on-primary opacity-0 group-hover:opacity-100';

        removeBtn.innerHTML = getSVGIcon('close', 10);

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

        container.innerHTML = `

            <div class="multiple-choice-container space-y-4">

                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.options">Options</label>

                <div class="answers-grid grid grid-cols-2 gap-3"></div>

                <button class="add-option-btn w-full bg-transparent border border-outline-variant/10 rounded-lg p-3 flex items-center justify-center gap-2 text-on-surface hover:bg-surface-container-highest transition-all group">

                    <span class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">${getSVGIcon('plus', 14)}</span>

                    <span class="font-medium text-sm">Add Answer Option</span>

                </button>

            </div>

        `;

        

        const grid = container.querySelector('.answers-grid');

        const addBtn = container.querySelector('.add-option-btn');

        

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

    }



    if (type === "typing") {

        container.innerHTML = `
            <div class="typing-answer-container">
                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.answer">Answer</label>
                <div class="rich-text-input typing-answer w-full bg-surface-container-highest border border-outline-variant/15 rounded-xl p-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 min-h-[120px] transition-all hover:border-outline-variant/30" contenteditable="true" data-translate-placeholder="quiz.typingAnswerPlaceholder" data-placeholder="Enter your answer here..."></div>
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

        container.innerHTML = `

            <div class="matching-container space-y-4">

                <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.answerPairs">Answer Pairs</label>

                <div class="matching-pairs space-y-3"></div>

                <div class="flex gap-3 pt-2">

                    <button class="add-pair-btn flex-1 bg-transparent border border-outline-variant/10 rounded-xl p-3 flex items-center justify-center gap-2 text-on-surface hover:bg-surface-container-highest transition-all group">

                        <span class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-all">${getSVGIcon('plus', 14)}</span>

                        <span class="font-medium text-sm">Add Pair</span>

                    </button>

                    <button class="rem-pair-btn flex-1 bg-transparent border border-outline-variant/10 rounded-xl p-3 flex items-center justify-center gap-2 text-on-surface hover:bg-surface-container-highest transition-all group">

                        <span class="w-6 h-6 rounded-full bg-error/10 flex items-center justify-center text-error group-hover:bg-error group-hover:text-on-primary transition-all">${getSVGIcon('close', 14)}</span>

                        <span class="font-medium text-sm">Remove Pair</span>

                    </button>

                </div>

            </div>

        `;

        

        const pairs = container.querySelector('.matching-pairs');

        const addPairBtn = container.querySelector('.add-pair-btn');

        const remPairBtn = container.querySelector('.rem-pair-btn');

        

        function addPair() {

            const row = document.createElement("div");

            row.className = "matching-row bg-transparent border border-outline-variant/10 rounded-xl p-4 transition-all hover:border-outline-variant/20";

            row.innerHTML = `

                <div class="grid grid-cols-2 gap-4">

                    <div class="matching-input-container">

                        <div class="rich-text-input matching-left w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg p-3 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 min-h-[60px] transition-all hover:border-outline-variant/20" contenteditable="true" data-translate-placeholder="quiz.leftSide" data-placeholder="Left side"></div>

                    </div>

                    <div class="matching-input-container">

                        <div class="rich-text-input matching-right w-full bg-surface-container-highest border border-outline-variant/10 rounded-lg p-3 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 min-h-[60px] transition-all hover:border-outline-variant/20" contenteditable="true" data-translate-placeholder="quiz.rightSide" data-placeholder="Right side"></div>

                    </div>

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

    }



    if (type === "fill") {

        container.innerHTML = `
            <div class="fill-container space-y-6">
                <div class="sentence-group">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.sentenceWithBlanks">Sentence with blanks</label>
                    <textarea class="fill-sentence w-full bg-surface-container-highest border border-outline-variant/15 rounded-xl p-4 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 resize-none transition-all hover:border-outline-variant/30" data-translate-placeholder="quiz.sentencePlaceholder" placeholder="Enter the sentence that should have hidden words here" rows="3" oninput="updateBlanks(this)"></textarea>
                </div>
                
                <div class="options-group">
                    <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 block" data-translate="quiz.fillOptions">Fill Options</label>
                    <div class="fill-options-container space-y-4">
                        <div class="flex gap-3">
                            <input type="text" class="fill-options-input flex-1 bg-surface-container-highest border border-outline-variant/15 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 transition-all hover:border-outline-variant/30" data-translate-placeholder="quiz.fillOptionsPlaceholder" placeholder="Enter options separated by commas and press Add">
                            <button class="add-fill-options-btn bg-primary text-on-primary rounded-xl p-3 flex items-center justify-center hover:bg-primary/90 transition-all group" onclick="addFillOptions(this)" data-translate-title="quiz.addFillOptions" title="Add Fill Options">
                                <span class="w-5 h-5 flex items-center justify-center">${getSVGIcon('plus', 16)}</span>
                            </button>
                        </div>
                        
                        <div class="draggable-answers min-h-[80px] bg-surface border border-outline-variant/10 rounded-xl p-4" id="draggable-answers-${questionCount}"></div>
                    </div>
                </div>
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

        btn.style.display = "block"; // Always show remove buttons

    });

}



function copyQuestion(sourceBlock) {

    const questionType = sourceBlock.querySelector('.question-type').value;

    const questionTextElement = sourceBlock.querySelector('.rich-text-input.question-text');

    const questionText = questionTextElement ? questionTextElement.innerHTML : '';

    

    // Get all blocks before adding new one

    const allBlocksBefore = Array.from(document.querySelectorAll('.question-block'));

    const sourceIndex = allBlocksBefore.indexOf(sourceBlock);



    addQuestion(sourceBlock);



    // Find the newly created block

    const allBlocksAfter = Array.from(document.querySelectorAll('.question-block'));

    let newBlock = null;

    

    // Find the block that wasn't in the original list

    for (const block of allBlocksAfter) {

        if (!allBlocksBefore.includes(block)) {

            newBlock = block;

            break;

        }

    }



    if (!newBlock || newBlock === sourceBlock) {

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



    // Render content and copy specific data with a small delay to ensure rendering is complete

    setTimeout(() => {

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

    }, 50);

}



function copyMultipleChoiceAnswers(sourceBlock, newBlock) {

    const sourceAnswers = sourceBlock.querySelectorAll('.answer-option');

    const answersGrid = newBlock.querySelector('.answers-grid');

    

    answersGrid.innerHTML = '';

    

    sourceAnswers.forEach(sourceOption => {

        const sourceInput = sourceOption.querySelector('.rich-text-input.answer-input');

        const sourceCorrectBtn = sourceOption.querySelector('.correct-answer-btn');

        const option = document.createElement("div");

        option.className = "answer-option bg-transparent border border-outline-variant/10 rounded-lg p-3 flex items-center gap-2 transition-all hover:border-outline-variant/20 group";

        

        const inputContainer = document.createElement("div");

        inputContainer.className = "answer-input-container flex-1";

        

        const input = document.createElement("div");

        input.className = "rich-text-input answer-input w-full bg-surface-container-highest border border-outline-variant/10 rounded-md p-2 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/50 min-h-[36px] transition-all hover:border-outline-variant/20 text-sm";

        input.contentEditable = true;

        input.dataset.placeholder = "Answer option";

        input.setAttribute('data-translate-placeholder', 'quiz.answerPlaceholder');

        if (sourceInput) input.innerHTML = sourceInput.innerHTML;

        

        inputContainer.appendChild(input);

        

        const correctBtn = document.createElement("button");

        correctBtn.className = "correct-answer-btn w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center text-on-surface-variant transition-all hover:bg-primary/10 hover:border-primary/30 hover:text-primary group-hover:border-primary/20 flex-shrink-0";

        correctBtn.innerHTML = getSVGIcon('check', 14);

        correctBtn.onclick = () => {

            answersGrid.querySelectorAll('.correct-answer-btn').forEach(btn => {

                btn.classList.remove('selected', 'bg-primary', 'text-on-primary', 'border-primary');

                btn.classList.add('bg-surface-container-highest', 'text-on-surface-variant', 'border-outline-variant/20');

            });

            correctBtn.classList.add('selected', 'bg-primary', 'text-on-primary', 'border-primary');

            correctBtn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant', 'border-outline-variant/20');

            triggerAutosave();

        };

        if (sourceCorrectBtn?.classList.contains('selected')) {

            correctBtn.classList.add('selected', 'bg-primary', 'text-on-primary', 'border-primary');

            correctBtn.classList.remove('bg-surface-container-highest', 'text-on-surface-variant', 'border-outline-variant/20');

        };

        

        const removeBtn = document.createElement("button");

        removeBtn.className = "remove-option-btn w-6 h-6 rounded-full bg-error/10 text-error flex items-center justify-center transition-all hover:bg-error hover:text-on-primary opacity-0 group-hover:opacity-100 flex-shrink-0";

        removeBtn.innerHTML = getSVGIcon('close', 12);

        removeBtn.onclick = () => option.remove();

        

        option.appendChild(inputContainer);

        option.appendChild(correctBtn);

        option.appendChild(removeBtn);

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

            optionChip.className = 'fill-option-chip bg-surface-container-highest border border-outline-variant/15 rounded-lg px-3 py-2 flex items-center gap-2 transition-all hover:border-outline-variant/30 group cursor-pointer';

            optionChip.innerHTML = `

                <span class="option-text text-sm font-medium">${optionText}</span>

                <button class="remove-option-btn w-5 h-5 rounded-full bg-error/10 text-error flex items-center justify-center transition-all hover:bg-error hover:text-on-primary opacity-0 group-hover:opacity-100" onclick="this.parentElement.remove()">${getSVGIcon('close', 10)}</button>

            `;

            newOptionsList.appendChild(optionChip);

        });

        // Maintain consistent DOM structure

        newOptionsContainer.appendChild(newOptionsList);

    }

}


function copyMatchingPairs(sourceBlock, newBlock) {

    const sourceRows = sourceBlock.querySelectorAll('.matching-row');

    const newPairsContainer = newBlock.querySelector('.matching-pairs');

    

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

            showNotificationModal(t('modal.validation.title'), errorMessage, 'error');

            return;

        }

        

        // Save test data to storage for test runner (shared across tabs)

        const testDataString = JSON.stringify(testData);

        console.log('Single-player test data string length:', testDataString.length);

        console.log('Single-player test data string preview:', testDataString.substring(0, 200) + '...');

        if (!testDataString || testDataString === '{}' || testDataString === '{"title":"","instructions":"","questions":[],"quiz_type":"single"}') {

            alert('Error: Test data is empty or invalid. Please add valid questions before running the test.');

            return;

        }

        localStorage.setItem('testData', testDataString);
        sessionStorage.setItem('testData', testDataString);
        const url = 'test-runner.html#' + encodeURIComponent(testDataString);
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
            alert('Popup blocked! Please allow popups for this site and try again.');
            return;
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



        // Validate multiple choice questions have correct answers

        const validationErrors = validateMultipleChoiceQuestions(testData);

        

        if (validationErrors.length > 0) {

            // Highlight invalid questions with red borders

            highlightInvalidQuestions(validationErrors);

            

            // Scroll to first invalid question

            scrollToFirstInvalidQuestion(validationErrors);

            

            // Show error message

            const errorMessage = `Cannot save quiz: ${validationErrors.length} multiple choice question(s) missing correct answer. Please select a correct answer for each highlighted question.`;

            showNotificationModal(t('modal.validation.title'), errorMessage, 'error');

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

                await window.clearAutosaveFromSupabase('single');

                console.log('Autosave cleared after manual save');

            }



            // Update current editing ID

            currentEditingQuizId = result.data.id;



            // Update URL to include the quiz ID

            window.history.replaceState({}, '', `?id=${result.data.id}`);



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

        

        if (!questionText || !questionText.trim()) return; // Skip empty questions

        

        const question = {

            type: questionType,

            question: questionText

        };

        

        if (questionType === 'multiple') {

            const options = [];

            let correctIndex = -1;

            

            block.querySelectorAll('.answer-option').forEach((option) => {

                const input = option.querySelector('.rich-text-input.answer-input');

                if (input && input.innerHTML.trim()) {

                    const optionData = {

                        text: input.innerHTML.trim()

                    };

                    

                    if (option.querySelector('.correct-answer-btn.selected')) {

                        correctIndex = options.length;

                    }

                    options.push(optionData);

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

                

                if (leftItem || rightItem) {

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

        questions: questions,

        quiz_type: 'single'

    };

    console.log('Returning test data:', result);

    return result;

}


















// Validation functions for runTest

function validateMultipleChoiceQuestions(testData) {

    const validationErrors = [];

    

    testData.questions.forEach((question, questionIndex) => {

        if (question.type === 'multiple') {

            // Check if question has a correct answer

            const correctAnswer = Number(question.correctAnswer);
            const optionCount = Array.isArray(question.options) ? question.options.length : 0;
            if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer >= optionCount) {

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
