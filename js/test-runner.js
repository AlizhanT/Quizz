// Test Runner State Management
let testData = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let confirmedQuestions = new Set();
let validationErrors = [];
let resizeTimeout = null;

// Dynamic Font Scaling Functions
function calculateOptimalScale(questionType, questionData) {
    let questionScale = 1;
    let optionsScale = 1;
    
    if (questionType === 'multiple') {
        const questionText = questionData.question || '';
        const maxCharsPerLine = 80; // Approximate characters that fit in one line at normal size
        
        // Simple: if question has more characters than fit in one line, scale it down
        if (questionText.length > maxCharsPerLine) {
            questionScale = maxCharsPerLine / questionText.length;
            questionScale = Math.max(questionScale, 0.4); // Minimum readable size
        }
        
        // For options, just check if there are too many
        const optionCount = questionData.options?.length || 0;
        if (optionCount > 4) {
            optionsScale = 0.8; // Smaller if many options
        }
        
    } else if (questionType === 'fill') {
        const sentenceText = questionData.sentence || '';
        const maxCharsPerLine = 90; // Fill sentences can be a bit longer
        
        if (sentenceText.length > maxCharsPerLine) {
            questionScale = maxCharsPerLine / sentenceText.length;
            questionScale = Math.max(questionScale, 0.4);
        }
        
    } else if (questionType === 'matching') {
        // For matching, just scale if there are many pairs
        const pairCount = questionData.pairs?.length || 0;
        if (pairCount > 6) {
            optionsScale = 0.7;
        }
    }
    
    console.log('Simple scaling:', {
        questionType,
        questionScale,
        optionsScale
    });
    
    return { questionScale, optionsScale };
}

function fitContentToViewport() {
    const root = document.documentElement;
    const container = document.querySelector('.test-container');
    const questionContainer = document.getElementById('questionContainer');
    
    if (!container || !questionContainer) return;
    
    const question = testData.questions[currentQuestionIndex];
    const { questionScale, optionsScale } = calculateOptimalScale(question.type, question);
    
    // Apply separate scales
    root.style.setProperty('--question-scale', questionScale.toString());
    root.style.setProperty('--options-scale', optionsScale.toString());
    root.style.setProperty('--font-scale', optionsScale.toString()); // For other elements
}

function debounceFitContent() {
    if (resizeTimeout) {
        clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(fitContentToViewport, 150);
}

// Utility function to shuffle an array
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Notification System Functions
function showNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.remove('hidden');
    }
}

function hideNotificationPanel() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.add('hidden');
    }
}

function addNotification(message, type = 'error') {
    const content = document.getElementById('notificationContent');
    if (!content) return;
    
    const notification = document.createElement('div');
    notification.className = `notification-item ${type}`;
    notification.textContent = message;
    
    content.appendChild(notification);
    showNotificationPanel();
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        notification.remove();
        // Hide panel if no more notifications
        if (content.children.length === 0) {
            hideNotificationPanel();
        }
    }, 5000);
}

function clearValidationErrors() {
    // Remove validation styling from all elements
    document.querySelectorAll('.validation-error').forEach(element => {
        element.classList.remove('validation-error');
    });
    
    // Clear validation errors array
    validationErrors = [];
    
    // Hide notification panel
    hideNotificationPanel();
}

function validateCurrentQuestion() {
    const question = testData.questions[currentQuestionIndex];
    const errors = [];
    
    if (!question) {
        errors.push('Question data is missing');
        return errors;
    }
    
    // Check if question area is empty
    if (!question.question || question.question.trim() === '') {
        errors.push('Question text is empty');
    }
    
    // Check for missing correct answer in multiple choice
    if (question.type === 'multiple') {
        if (question.correctAnswer === undefined || question.correctAnswer === null || question.correctAnswer === -1) {
            errors.push('No correct answer selected for this multiple choice question');
        }
    }
    
    return errors;
}

function applyValidationErrors(errors) {
    if (errors.length === 0) return;
    
    // Add validation error styling to question container
    const container = document.getElementById('questionContainer');
    if (container) {
        container.classList.add('validation-error');
    }
    
    // Add specific styling based on question type
    const question = testData.questions[currentQuestionIndex];
    if (question.type === 'multiple') {
        document.querySelectorAll('.answer-option').forEach(option => {
            option.classList.add('validation-error');
        });
    } else if (question.type === 'fill') {
        document.querySelectorAll('.blank-drop-zone').forEach(zone => {
            zone.classList.add('validation-error');
        });
    } else if (question.type === 'matching') {
        document.querySelectorAll('.matching-stack').forEach(stack => {
            stack.classList.add('validation-error');
        });
    }
    
    // Add notifications
    errors.forEach(error => {
        addNotification(error, 'error');
    });
    
    // Store errors for clearing later
    validationErrors = errors;
}

// Initialize test runner
document.addEventListener('DOMContentLoaded', async () => {
    loadTestData();
    
    // Add keyboard navigation
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Add window resize listener for dynamic font scaling
    window.addEventListener('resize', debounceFitContent);
});

function loadTestData() {
    console.log('loadTestData() called');
    console.log('SessionStorage available:', typeof Storage !== 'undefined');
    console.log('SessionStorage keys:', Object.keys(sessionStorage));
    
    // Try to get test data from sessionStorage first (from saved-quizzes page)
    const savedData = sessionStorage.getItem('testData');
    console.log('SessionStorage data found:', !!savedData);
    console.log('SessionStorage data length:', savedData ? savedData.length : 0);
    console.log('SessionStorage data type:', typeof savedData);
    
    if (savedData) {
        try {
            console.log('Attempting to parse sessionStorage data...');
            testData = JSON.parse(savedData);
            console.log('Parsed test data:', testData);
            console.log('Test data questions count:', testData?.questions?.length);
            console.log('Test data title:', testData?.title);
            console.log('Test data structure:', Object.keys(testData || {}));
            
            sessionStorage.removeItem('testData'); // Clean up
            initializeTest();
        } catch (error) {
            console.error('Error parsing test data:', error);
            console.error('Raw sessionStorage data:', savedData);
            document.getElementById('questionContainer').innerHTML = '<p>' + t('testRunner.errorLoading') + '</p>';
        }
    } else {
        // Fallback for direct access (shouldn't happen with our flow)
        console.log('No test data found in sessionStorage');
        console.log('Current sessionStorage contents:', sessionStorage);
        document.getElementById('questionContainer').innerHTML = '<p>' + t('testRunner.noTestData') + '</p>';
    }
}

function handleKeyboardNavigation(e) {
    // Only handle arrow keys if not typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            previousQuestion();
            break;
        case 'ArrowRight':
            e.preventDefault();
            nextQuestion();
            break;
    }
}

function initializeTest() {
    if (!testData || !testData.questions || testData.questions.length === 0) {
        document.getElementById('questionContainer').innerHTML = '<p>' + t('testRunner.noQuestions') + '</p>';
        return;
    }

    // Filter out typing questions
    testData.questions = testData.questions.filter(question => question.type !== 'typing');

    if (testData.questions.length === 0) {
        document.getElementById('questionContainer').innerHTML = '<p>' + t('testRunner.noScorableQuestions') + '</p>';
        return;
    }

    // Set page title and initialize
    document.getElementById('pageTitle').textContent = testData.title || t('testRunner.test');
    userAnswers = new Array(testData.questions.length).fill(null);
    displayQuestion();
    updateProgress();
}

// Question Display Management
function displayQuestion() {
    const question = testData.questions[currentQuestionIndex];
    const container = document.getElementById('questionContainer');
    
    // Update question counter
    document.getElementById('questionCounter').textContent = 
        `${currentQuestionIndex + 1}/${testData.questions.length}`;

    // Clear previous content and validation errors
    container.innerHTML = '';
    clearValidationErrors();

    // Validate current question
    const errors = validateCurrentQuestion();
    if (errors.length > 0) {
        applyValidationErrors(errors);
        // Don't display question if it has validation errors
        return;
    }

    // Calculate and apply smart scaling BEFORE rendering
    const { questionScale, optionsScale } = calculateOptimalScale(question.type, question);
    document.documentElement.style.setProperty('--question-scale', questionScale.toString());
    document.documentElement.style.setProperty('--options-scale', optionsScale.toString());
    document.documentElement.style.setProperty('--font-scale', optionsScale.toString()); // For other elements

    // Display question based on type
    const questionDisplayers = {
        'multiple': displayMultipleChoice,
        'fill': window.displayFillInBlank,
        'matching': displayMatching
    };
    
    const displayer = questionDisplayers[question.type];
    if (displayer) displayer(question, container);
    
    // Lock confirmed questions
    lockConfirmedQuestion();
    updateNavigationButtons();
}

// Helper Functions for Question Display
function createQuestionText(question) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-text';
    
    // Handle question text with images
    if (question.question) {
        questionDiv.innerHTML = question.question;
    }
    
    // Add question images if they exist
    if (question.images && question.images.length > 0) {
        question.images.forEach(imageData => {
            const img = document.createElement('img');
            img.src = imageData.src;
            img.className = 'question-image';
            img.alt = imageData.name || 'Question image';
            questionDiv.appendChild(img);
        });
    }
    
    return questionDiv;
}

function createAnswerOption(option, index) {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'answer-option';
    optionDiv.onclick = () => selectAnswer(index);
    
    // Add event listener to clear validation errors when user interacts
    optionDiv.addEventListener('click', clearValidationErrors);
    
    const optionContent = document.createElement('div');
    optionContent.className = 'option-content';
    
    // Create a text span for the option text
    if (option.text) {
        const textSpan = document.createElement('span');
        textSpan.className = 'option-text';
        textSpan.innerHTML = option.text;
        optionContent.appendChild(textSpan);
    }
    
    // Add option images if they exist
    if (option.images && option.images.length > 0) {
        const imagesContainer = document.createElement('div');
        imagesContainer.className = 'option-images';
        
        option.images.forEach(imageData => {
            const img = document.createElement('img');
            img.src = imageData.src;
            img.className = 'option-image';
            img.alt = imageData.name || 'Option image';
            imagesContainer.appendChild(img);
        });
        
        optionContent.appendChild(imagesContainer);
    }
    
    optionDiv.appendChild(optionContent);
    return optionDiv;
}


function createMatchingContainer(question) {
    const matchingContainer = document.createElement('div');
    matchingContainer.className = 'matching-container-new';
    
    // Create left column (left ops + containers)
    const leftColumn = document.createElement('div');
    leftColumn.className = 'matching-left-column';
    
    // Create right column (shuffled right ops)
    const rightColumn = document.createElement('div');
    rightColumn.className = 'matching-right-column';
    
    // Arrays to hold the items
    const leftItems = [];
    const rightItems = [];
    
    // Add pairs to columns
    question.pairs.forEach((pair, index) => {
        // Left item + container group
        const leftGroup = document.createElement('div');
        leftGroup.className = 'matching-left-group';
        
        // Left item (fixed)
        const leftItem = document.createElement('div');
        leftItem.className = 'matching-left-item';
        leftItem.dataset.originalIndex = index;
        
        const leftContent = document.createElement('div');
        
        if (pair.left) {
            leftContent.innerHTML = pair.left;
        }
        
        // Add left side images if they exist
        if (pair.leftImages && pair.leftImages.length > 0) {
            pair.leftImages.forEach(imageData => {
                const img = document.createElement('img');
                img.src = imageData.src;
                img.className = 'matching-image';
                img.alt = imageData.name || 'Left item image';
                leftContent.appendChild(img);
            });
        }
        
        leftItem.appendChild(leftContent);
        
        // Drop zone (empty container)
        const dropZone = document.createElement('div');
        dropZone.className = 'matching-drop-zone';
        dropZone.dataset.correctIndex = index;
        dropZone.dataset.occupied = 'false';
        dropZone.dataset.droppedIndex = '';
        
        // Add drop event listeners
        dropZone.addEventListener('dragover', handleMatchingDragOver);
        dropZone.addEventListener('drop', handleMatchingDrop);
        dropZone.addEventListener('dragleave', handleMatchingDragLeave);
        
        // Add event listener to clear validation errors when user interacts
        dropZone.addEventListener('click', () => {
            if (typeof clearValidationErrors === 'function') {
                clearValidationErrors();
            }
        });
        dropZone.addEventListener('dragover', () => {
            if (typeof clearValidationErrors === 'function') {
                clearValidationErrors();
            }
        });
        
        // Add drag event listeners for removing options
        dropZone.addEventListener('dragstart', handleMatchingDropZoneDragStart);
        dropZone.addEventListener('dragend', handleMatchingDropZoneDragEnd);
        
        // Assemble left group: left item + drop zone
        leftGroup.appendChild(leftItem);
        leftGroup.appendChild(dropZone);
        leftItems.push(leftGroup);
        
        // Right item (draggable option)
        const rightItem = document.createElement('div');
        rightItem.className = 'matching-right-item';
        rightItem.dataset.originalIndex = index;
        rightItem.draggable = true;
        
        const rightContent = document.createElement('div');
        
        if (pair.right) {
            rightContent.innerHTML = pair.right;
        }
        
        // Add right side images if they exist
        if (pair.rightImages && pair.rightImages.length > 0) {
            pair.rightImages.forEach(imageData => {
                const img = document.createElement('img');
                img.src = imageData.src;
                img.className = 'matching-image';
                img.alt = imageData.name || 'Right item image';
                rightContent.appendChild(img);
            });
        }
        
        rightItem.appendChild(rightContent);
        
        // Add drag event listeners for right items
        rightItem.addEventListener('dragstart', handleMatchingRightDragStart);
        rightItem.addEventListener('dragend', handleMatchingRightDragEnd);
        
        rightItems.push(rightItem);
    });
    
    // Shuffle the right items
    const shuffledRightItems = shuffleArray([...rightItems]);
    
    // Add left items in original order
    leftItems.forEach(leftGroup => leftColumn.appendChild(leftGroup));
    
    // Add right items in shuffled order
    shuffledRightItems.forEach(rightItem => rightColumn.appendChild(rightItem));
    
    // Assemble the structure
    matchingContainer.appendChild(leftColumn);
    matchingContainer.appendChild(rightColumn);
    
    return matchingContainer;
}

// Question Type Display Functions
function displayMultipleChoice(question, container) {
    const questionText = createQuestionText(question);
    container.appendChild(questionText);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'answer-options';

    question.options.forEach((option, index) => {
        const optionDiv = createAnswerOption(option, index);
        optionsContainer.appendChild(optionDiv);
    });

    container.appendChild(optionsContainer);
}


function displayMatching(question, container) {
    const questionText = createQuestionText(question);
    container.appendChild(questionText);

    const matchingContainer = createMatchingContainer(question);
    container.appendChild(matchingContainer);

    // Initialize matching answers
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = { matches: {}, checked: false };
    }
    restoreMatchingAnswers();
}


// New matching drag and drop handlers
let draggedMatchingRightElement = null;
let draggedMatchingDropZone = null;

function handleMatchingRightDragStart(e) {
    draggedMatchingRightElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.textContent);
}

function handleMatchingRightDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleMatchingDropZoneDragStart(e) {
    const dropZone = e.currentTarget;
    
    // Only allow dragging if the drop zone is filled and not confirmed
    if (dropZone.dataset.occupied === 'true' && !dropZone.classList.contains('confirmed')) {
        draggedMatchingDropZone = dropZone;
        dropZone.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', dropZone.textContent);
        
        // Create a ghost image showing the option being removed
        const ghostImage = document.createElement('div');
        ghostImage.textContent = dropZone.textContent;
        ghostImage.style.cssText = 'position: absolute; top: -1000px; left: -1000px; padding: 8px 12px; background: #f8f9fa; border: 2px solid #6c757d; border-radius: 8px; font-weight: 600;';
        document.body.appendChild(ghostImage);
        e.dataTransfer.setDragImage(ghostImage, 0, 0);
        setTimeout(() => ghostImage.remove(), 0);
    } else {
        e.preventDefault();
    }
}

function handleMatchingDropZoneDragEnd(e) {
    const dropZone = e.currentTarget;
    dropZone.classList.remove('dragging');
    
    // If the drop zone was dragged and dropped outside, remove the option
    if (draggedMatchingDropZone === dropZone) {
        // Check if we're outside any valid drop zone
        setTimeout(() => {
            if (draggedMatchingDropZone) {
                removeMatchingOptionFromDropZone(dropZone);
                draggedMatchingDropZone = null;
            }
        }, 10);
    }
}

function handleMatchingDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dropZone = e.currentTarget;
    // Always show drag-over effect, regardless of occupation status
    if (dropZone.classList.contains('matching-drop-zone')) {
        dropZone.classList.add('drag-over');
    }
}

function handleMatchingDragLeave(e) {
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
}

function handleMatchingDrop(e) {
    e.preventDefault();
    
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    // Handle dropping a drop zone onto another drop zone (swap or remove)
    if (draggedMatchingDropZone && draggedMatchingDropZone !== dropZone) {
        // If both drop zones are filled, swap their contents
        if (draggedMatchingDropZone.dataset.occupied === 'true' && dropZone.dataset.occupied === 'true') {
            swapMatchingDropZoneContents(draggedMatchingDropZone, dropZone);
        }
        // If dragging a filled drop zone onto an empty one, move the option
        else if (draggedMatchingDropZone.dataset.occupied === 'true' && dropZone.dataset.occupied === 'false') {
            moveMatchingOptionBetweenDropZones(draggedMatchingDropZone, dropZone);
        }
        draggedMatchingDropZone = null;
        return;
    }
    
    if (!draggedMatchingRightElement) return;
    
    // If the drop zone is already occupied, remove the existing option first
    if (dropZone.dataset.occupied === 'true') {
        removeMatchingOptionFromDropZone(dropZone);
    }
    
    // Place the option in the drop zone
    const originalIndex = draggedMatchingRightElement.dataset.originalIndex;
    
    dropZone.textContent = draggedMatchingRightElement.textContent;
    dropZone.dataset.originalIndex = originalIndex;
    dropZone.dataset.occupied = 'true';
    dropZone.classList.add('filled');
    
    // Hide the dragged right item
    draggedMatchingRightElement.style.display = 'none';
    draggedMatchingRightElement.classList.add('used');
    
    // Update user answers
    const correctIndex = parseInt(dropZone.dataset.correctIndex);
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = {
            matches: {},
            checked: false
        };
    }
    userAnswers[currentQuestionIndex].matches[correctIndex] = parseInt(originalIndex);
    
    // Check if all drop zones are filled
    checkAllMatchingDropZonesFilled();
}

function removeMatchingOptionFromDropZone(dropZone) {
    const optionText = dropZone.textContent;
    const originalIndex = dropZone.dataset.originalIndex;
    
    // Clear the drop zone
    dropZone.textContent = '';
    dropZone.dataset.occupied = 'false';
    dropZone.classList.remove('filled');
    delete dropZone.dataset.originalIndex;
    
    // Find and show the corresponding right item
    document.querySelectorAll('.matching-right-item').forEach(item => {
        if (item.dataset.originalIndex === originalIndex) {
            item.style.display = '';
            item.classList.remove('used');
        }
    });
    
    // Update user answers
    const correctIndex = parseInt(dropZone.dataset.correctIndex);
    if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].matches) {
        delete userAnswers[currentQuestionIndex].matches[correctIndex];
    }
    
    // Check if all drop zones are filled
    checkAllMatchingDropZonesFilled();
}

function swapMatchingDropZoneContents(dropZone1, dropZone2) {
    const tempText = dropZone1.textContent;
    const tempOriginalIndex = dropZone1.dataset.originalIndex;
    
    dropZone1.textContent = dropZone2.textContent;
    dropZone1.dataset.originalIndex = dropZone2.dataset.originalIndex;
    
    dropZone2.textContent = tempText;
    dropZone2.dataset.originalIndex = tempOriginalIndex;
    
    // Update user answers
    const correctIndex1 = parseInt(dropZone1.dataset.correctIndex);
    const correctIndex2 = parseInt(dropZone2.dataset.correctIndex);
    
    if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].matches) {
        const temp = userAnswers[currentQuestionIndex].matches[correctIndex1];
        userAnswers[currentQuestionIndex].matches[correctIndex1] = userAnswers[currentQuestionIndex].matches[correctIndex2];
        userAnswers[currentQuestionIndex].matches[correctIndex2] = temp;
    }
    
    // Check if all drop zones are filled
    checkAllMatchingDropZonesFilled();
}

function moveMatchingOptionBetweenDropZones(sourceDropZone, targetDropZone) {
    const optionText = sourceDropZone.textContent;
    const originalIndex = sourceDropZone.dataset.originalIndex;
    
    // Move to target
    targetDropZone.textContent = optionText;
    targetDropZone.dataset.originalIndex = originalIndex;
    targetDropZone.dataset.occupied = 'true';
    targetDropZone.classList.add('filled');
    
    // Clear source
    sourceDropZone.textContent = '';
    sourceDropZone.dataset.occupied = 'false';
    sourceDropZone.classList.remove('filled');
    delete sourceDropZone.dataset.originalIndex;
    
    // Update user answers
    const sourceCorrectIndex = parseInt(sourceDropZone.dataset.correctIndex);
    const targetCorrectIndex = parseInt(targetDropZone.dataset.correctIndex);
    
    if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].matches) {
        userAnswers[currentQuestionIndex].matches[targetCorrectIndex] = userAnswers[currentQuestionIndex].matches[sourceCorrectIndex];
        delete userAnswers[currentQuestionIndex].matches[sourceCorrectIndex];
    }
    
    // Check if all drop zones are filled
    checkAllMatchingDropZonesFilled();
}

function restoreMatchingAnswers() {
    const answer = userAnswers[currentQuestionIndex];
    if (!answer || !answer.matches) return;
    
    const dropZones = document.querySelectorAll('.matching-drop-zone');
    const rightItems = document.querySelectorAll('.matching-right-item');
    
    Object.entries(answer.matches).forEach(([correctIndex, originalIndex]) => {
        const dropZone = Array.from(dropZones).find(zone => 
            parseInt(zone.dataset.correctIndex) === parseInt(correctIndex)
        );
        const rightItem = Array.from(rightItems).find(item => 
            parseInt(item.dataset.originalIndex) === parseInt(originalIndex)
        );
        
        if (dropZone && rightItem) {
            dropZone.textContent = rightItem.textContent;
            dropZone.dataset.originalIndex = originalIndex;
            dropZone.dataset.occupied = 'true';
            dropZone.classList.add('filled');
            
            rightItem.style.display = 'none';
            rightItem.classList.add('used');
        }
    });
    
    checkAllMatchingDropZonesFilled();
}

function checkNewPairs(question) {
    const dropZones = document.querySelectorAll('.matching-drop-zone');
    
    let correctPairs = 0;
    
    // Check each drop zone for correct matching
    dropZones.forEach((dropZone) => {
        const correctIndex = parseInt(dropZone.dataset.correctIndex);
        const droppedIndex = dropZone.dataset.originalIndex ? parseInt(dropZone.dataset.originalIndex) : null;
        
        // Remove existing status indicators
        const existingStatus = dropZone.querySelector('.pair-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // Add status indicator
        const status = document.createElement('div');
        status.className = 'pair-status';
        
        if (droppedIndex !== null && correctIndex === droppedIndex) {
            // Correct pair
            dropZone.classList.add('correct');
            dropZone.classList.remove('incorrect');
            status.classList.add('correct');
            status.classList.remove('incorrect');
            status.textContent = '✓';
            correctPairs++;
        } else {
            // Incorrect pair
            dropZone.classList.add('incorrect');
            dropZone.classList.remove('correct');
            status.classList.add('incorrect');
            status.classList.remove('correct');
            status.textContent = '✗';
        }
        
        dropZone.appendChild(status);
    });
    
    // Mark as checked
    userAnswers[currentQuestionIndex].checked = true;
    userAnswers[currentQuestionIndex].correctPairs = correctPairs;
    
    // Disable navigation buttons during confirmation wait
    disableNavigationButtons();
    
    // Auto-advance to next question after showing feedback
    setTimeout(() => {
        if (currentQuestionIndex < testData.questions.length - 1) {
            nextQuestion();
        } else {
            // If this is the last question, finish the test
            finishTest();
        }
    }, 1500); // Wait 1.5 seconds to show results before advancing
}

function checkAllMatchingDropZonesFilled() {
    const dropZones = document.querySelectorAll('.matching-drop-zone');
    const allFilled = Array.from(dropZones).every(zone => zone.dataset.occupied === 'true');
    
    // If all drop zones are filled, check the pairs immediately
    if (allFilled) {
        const question = testData.questions[currentQuestionIndex];
        checkNewPairs(question);
    }
}

let draggedElement = null;
let draggedData = null;

function handleDragStart(e) {
    draggedElement = e.target;
    draggedData = {
        originalIndex: e.target.dataset.originalIndex,
        column: e.target.dataset.column
    };
    
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
    
    // Show drag indicator on the right stack immediately
    const rightStack = document.getElementById('rightStack');
    rightStack.classList.add('drag-active');
    
    // Create drag indicator if it doesn't exist
    createDragIndicator();
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    
    // Remove all drag-over classes
    document.querySelectorAll('.drag-over').forEach(elem => {
        elem.classList.remove('drag-over');
    });
    
    // Remove drag-active from right stack
    const rightStack = document.getElementById('rightStack');
    rightStack.classList.remove('drag-active');
    
    // Hide drag indicator
    hideDragIndicator();
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const stack = e.currentTarget;
    if (stack.classList.contains('matching-stack')) {
        stack.classList.add('drag-over');
        
        // Update drag indicator position
        updateDragIndicator(stack, e.clientY);
    }
}

function handleDragLeave(e) {
    const stack = e.currentTarget;
    if (stack.classList.contains('matching-stack')) {
        stack.classList.remove('drag-over');
        
        // Hide drag indicator when leaving the stack
        hideDragIndicator();
    }
}

function handleDrop(e) {
    e.preventDefault();
    
    const stack = e.currentTarget;
    stack.classList.remove('drag-over');
    
    // Hide drag indicator
    hideDragIndicator();
    
    if (!draggedElement || !draggedData) return;
    
    // Only allow dropping in the right stack
    if (stack.id !== 'rightStack') {
        return;
    }
    
    // Find the drop position
    const afterElement = getDragAfterElement(stack, e.clientY);
    
    if (afterElement == null) {
        stack.appendChild(draggedElement);
    } else {
        stack.insertBefore(draggedElement, afterElement);
    }
    
    // Save current order
    saveCurrentOrder();
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.matching-item:not(.dragging)')];
    const containerRect = container.getBoundingClientRect();
    
    // Clamp Y position to container bounds
    const clampedY = Math.max(containerRect.top, Math.min(containerRect.bottom, y));
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = clampedY - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function createDragIndicator() {
    // Remove existing indicator if any
    const existingIndicator = document.querySelector('.drag-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    // Create new indicator
    const indicator = document.createElement('div');
    indicator.className = 'drag-indicator';
    document.body.appendChild(indicator);
}

function updateDragIndicator(stack, mouseY) {
    const indicator = document.querySelector('.drag-indicator');
    if (!indicator) return;
    
    const afterElement = getDragAfterElement(stack, mouseY);
    const stackRect = stack.getBoundingClientRect();
    
    if (afterElement == null) {
        // Position at the bottom of the stack (after last element)
        const lastElement = stack.querySelector('.matching-item:last-child');
        if (lastElement) {
            const lastRect = lastElement.getBoundingClientRect();
            const gapTop = lastRect.bottom;
            const gapBottom = stackRect.bottom;
            const middleY = (gapTop + gapBottom) / 2;
            
            indicator.style.position = 'fixed';
            indicator.style.top = middleY + 'px';
            indicator.style.left = (stackRect.left + 10) + 'px';
            indicator.style.width = (stackRect.width - 20) + 'px';
        } else {
            // No elements in stack, position in the middle
            indicator.style.position = 'fixed';
            indicator.style.top = (stackRect.top + stackRect.height / 2) + 'px';
            indicator.style.left = (stackRect.left + 10) + 'px';
            indicator.style.width = (stackRect.width - 20) + 'px';
        }
    } else {
        // Position in the gap before the afterElement
        const afterRect = afterElement.getBoundingClientRect();
        const prevElement = afterElement.previousElementSibling;
        
        let gapTop, gapBottom;
        if (prevElement && prevElement.classList.contains('matching-item')) {
            const prevRect = prevElement.getBoundingClientRect();
            gapTop = prevRect.bottom;
            gapBottom = afterRect.top;
        } else {
            // This is the first element, position at the top
            gapTop = stackRect.top;
            gapBottom = afterRect.top;
        }
        
        const middleY = (gapTop + gapBottom) / 2;
        
        indicator.style.position = 'fixed';
        indicator.style.top = middleY + 'px';
        indicator.style.left = (stackRect.left + 10) + 'px';
        indicator.style.width = (stackRect.width - 20) + 'px';
    }
    
    indicator.classList.add('active');
}

function hideDragIndicator() {
    const indicator = document.querySelector('.drag-indicator');
    if (indicator) {
        indicator.classList.remove('active');
    }
}

function saveCurrentOrder() {
    const rightStack = document.getElementById('rightStack');
    const rightItems = Array.from(rightStack.querySelectorAll('.matching-item'));
    
    userAnswers[currentQuestionIndex].rightOrder = rightItems.map(item => parseInt(item.dataset.originalIndex));
}

function restoreOrder() {
    const savedOrder = userAnswers[currentQuestionIndex];
    
    if (savedOrder.rightOrder && savedOrder.rightOrder.length > 0) {
        const rightStack = document.getElementById('rightStack');
        const rightItems = Array.from(rightStack.querySelectorAll('.matching-item'));
        
        // Reorder right items according to saved order
        const reorderedRightItems = [];
        savedOrder.rightOrder.forEach(originalIndex => {
            const item = rightItems.find(i => parseInt(i.dataset.originalIndex) === originalIndex);
            if (item) reorderedRightItems.push(item);
        });
        
        rightStack.innerHTML = '';
        reorderedRightItems.forEach(item => rightStack.appendChild(item));
    }
}

function checkPairs(question) {
    const leftStack = document.getElementById('leftStack');
    const rightStack = document.getElementById('rightStack');
    
    const leftItems = Array.from(leftStack.querySelectorAll('.matching-item'));
    const rightItems = Array.from(rightStack.querySelectorAll('.matching-item'));
    
    let correctPairs = 0;
    
    // Check each position for correct pairing
    leftItems.forEach((leftItem, index) => {
        const leftOriginalIndex = parseInt(leftItem.dataset.originalIndex);
        const rightItem = rightItems[index];
        
        if (rightItem) {
            const rightOriginalIndex = parseInt(rightItem.dataset.originalIndex);
            
            // Remove existing status indicators
            const existingStatus = rightItem.querySelector('.pair-status');
            if (existingStatus) {
                existingStatus.remove();
            }
            
            // Add status indicator
            const status = document.createElement('div');
            status.className = 'pair-status';
            
            if (leftOriginalIndex === rightOriginalIndex) {
                // Correct pair
                rightItem.classList.add('correct');
                rightItem.classList.remove('incorrect');
                status.classList.add('correct');
                status.classList.remove('incorrect');
                status.textContent = '✓';
                correctPairs++;
            } else {
                // Incorrect pair
                rightItem.classList.add('incorrect');
                rightItem.classList.remove('correct');
                status.classList.add('incorrect');
                status.classList.remove('correct');
                status.textContent = '✗';
            }
            
            rightItem.appendChild(status);
        }
    });
    
    // Mark as checked
    userAnswers[currentQuestionIndex].checked = true;
    userAnswers[currentQuestionIndex].correctPairs = correctPairs;
    
    // Disable navigation buttons during confirmation wait
    disableNavigationButtons();
    
    // Disable check button
    const checkButton = document.querySelector('#actionButtonContainer .action-btn');
    if (checkButton) {
        checkButton.disabled = true;
        const totalPairs = question.pairs.length;
        checkButton.textContent = `Checked: ${correctPairs}/${totalPairs} correct pairs`;
    }
    
    // Auto-advance to next question after showing feedback
    setTimeout(() => {
        if (currentQuestionIndex < testData.questions.length - 1) {
            nextQuestion();
        } else {
            // If this is the last question, finish the test
            finishTest();
        }
    }, 1500); // Wait 1.5 seconds to show results before advancing
}

function selectAnswer(index) {
    userAnswers[currentQuestionIndex] = index;
    
    // Update UI to show selected answer
    document.querySelectorAll('.answer-option').forEach((option, i) => {
        if (i === index) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });
    
    // Check answer immediately
    checkMultipleChoiceAnswer();
}

function checkMultipleChoiceAnswer() {
    const question = testData.questions[currentQuestionIndex];
    const isCorrect = userAnswers[currentQuestionIndex] === question.correctAnswer;
    
    // Mark this question as confirmed
    confirmedQuestions.add(currentQuestionIndex);
    
    // Disable navigation buttons during confirmation wait
    disableNavigationButtons();
    
    // Disable all answer options
    document.querySelectorAll('.answer-option').forEach((option, index) => {
        option.style.pointerEvents = 'none';
        option.style.cursor = 'default';
        
        // Show feedback
        if (index === question.correctAnswer) {
            option.classList.add('correct');
        } else if (index === userAnswers[currentQuestionIndex] && !isCorrect) {
            option.classList.add('incorrect');
        }
    });
    
    // Auto-advance to next question after showing feedback
    setTimeout(() => {
        if (currentQuestionIndex < testData.questions.length - 1) {
            nextQuestion();
        } else {
            // If this is the last question, finish the test
            finishTest();
        }
    }, 1500);
}

function lockConfirmedQuestion() {
    const question = testData.questions[currentQuestionIndex];
    
    // If this question was already confirmed, lock it
    if (confirmedQuestions.has(currentQuestionIndex)) {
        if (question.type === 'multiple') {
            // Lock multiple choice options
            document.querySelectorAll('.answer-option').forEach((option, index) => {
                option.style.pointerEvents = 'none';
                option.style.cursor = 'default';
                
                // Show feedback for confirmed answer
                if (index === question.correctAnswer) {
                    option.classList.add('correct');
                } else if (index === userAnswers[currentQuestionIndex]) {
                    option.classList.add('incorrect');
                }
            });
        } else if (question.type === 'fill') {
            // Lock fill-in-the-blank question
            restoreFillAnswers();
            
            // Disable all drag and drop
            document.querySelectorAll('.fill-option-chip').forEach(chip => {
                chip.draggable = false;
                chip.style.cursor = 'default';
            });
            
            document.querySelectorAll('.blank-drop-zone').forEach(zone => {
                zone.style.cursor = 'default';
                zone.classList.add('confirmed');
            });
        }
    }
}

function nextQuestion() {
    if (currentQuestionIndex < testData.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
        updateProgress();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
        updateProgress();
    }
}

function restartTest() {
    // Reset all test state
    currentQuestionIndex = 0;
    userAnswers = new Array(testData.questions.length).fill(null);
    confirmedQuestions.clear();
    validationErrors = [];
    
    // Hide results container if visible
    const resultsContainer = document.getElementById('resultsContainer');
    if (resultsContainer) {
        resultsContainer.classList.add('hidden');
    }
    
    // Show question container
    const questionContainer = document.getElementById('questionContainer');
    if (questionContainer) {
        questionContainer.classList.remove('hidden');
    }
    
    // Reset and display first question
    displayQuestion();
    updateProgress();
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // Re-enable all buttons first (in case they were disabled during confirmation wait)
    if (prevBtn) prevBtn.disabled = false;
    if (nextBtn) nextBtn.disabled = false;

    // Update previous button - disabled only on first question
    if (prevBtn) prevBtn.disabled = currentQuestionIndex === 0;

    // Update next button - disabled on last question since we auto-advance
    if (nextBtn) nextBtn.disabled = currentQuestionIndex === testData.questions.length - 1;
}

function disableNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    // Disable all navigation buttons during confirmation wait
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
}

function updateProgress() {
    // No progress updates needed since question counter was removed
}

function finishTest() {
    calculateResults();
}

function calculateResults() {
    let correctCount = 0;
    let totalQuestions = testData.questions.length;

    testData.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        
        if (question.type === 'multiple' && userAnswer === question.correctAnswer) {
            correctCount++;
        } else if (question.type === 'fill' && userAnswer && userAnswer.blanks) {
            // For fill-in-the-blank, check if all blanks are filled correctly
            const correctWords = userAnswer.correctWords || [];
            const userBlanks = userAnswer.blanks;
            
            // Check if all blanks are filled and all are correct
            const allFilled = userBlanks.every(blank => blank !== null && blank !== undefined && blank !== '');
            const allCorrect = allFilled && userBlanks.every((blank, index) => {
                return blank && correctWords[index] && 
                       blank.toLowerCase().trim() === correctWords[index].toLowerCase().trim();
            });
            
            if (allCorrect && userBlanks.length === correctWords.length) {
                correctCount++;
            }
        } else if (question.type === 'matching') {
            // Check if pairs have been checked and count correct pairs
            if (userAnswer && userAnswer.checked && userAnswer.correctPairs !== undefined) {
                const totalPairs = question.pairs.length;
                const correctPairs = userAnswer.correctPairs;
                
                // Give full credit if all pairs are correct
                if (correctPairs === totalPairs) {
                    correctCount++;
                }
            }
        }
    });

    const percentage = Math.round((correctCount / totalQuestions) * 100);
    displayResults(percentage, correctCount, totalQuestions);
}

function displayResults(percentage, correctCount, totalQuestions, customMessage = null) {
    // Hide question container and navigation buttons
    document.getElementById('questionContainer').classList.add('hidden');
    document.querySelector('.navigation-buttons').classList.add('hidden');

    // Show results
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.classList.remove('hidden');

    document.getElementById('scoreDisplay').textContent = percentage + '%';
    
    let message = '';
    if (customMessage) {
        message = customMessage;
    } else if (percentage >= 90) {
        message = 'Excellent work! You have mastered this material.';
    } else if (percentage >= 80) {
        message = 'Great job! You have a strong understanding of material.';
    } else if (percentage >= 70) {
        message = 'Good work! You have a solid understanding of material.';
    } else if (percentage >= 60) {
        message = 'You passed! Consider reviewing the material for better understanding.';
    } else {
        message = 'Keep practicing! Review the material and try again.';
    }

    document.getElementById('resultsMessage').textContent = 
        `${message} You got ${correctCount} out of ${totalQuestions} questions correct.`;
}

function closeTest() {
    window.close();
    // If window.close() doesn't work (due to browser restrictions), redirect back
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 100);
}

function toggleFullscreen() {
    const testContainer = document.querySelector('.test-container');
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    
    if (!document.fullscreenElement) {
        // Enter fullscreen
        if (testContainer.requestFullscreen) {
            testContainer.requestFullscreen();
        } else if (testContainer.webkitRequestFullscreen) {
            testContainer.webkitRequestFullscreen();
        } else if (testContainer.mozRequestFullScreen) {
            testContainer.mozRequestFullScreen();
        } else if (testContainer.msRequestFullscreen) {
            testContainer.msRequestFullscreen();
        }
        
        // Change icon to exit fullscreen
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#6c757d"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/></svg>';
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        // Change icon back to enter fullscreen
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#6c757d"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"/></svg>';
    }
}

// Listen for fullscreen changes
document.addEventListener('fullscreenchange', updateFullscreenButton);
document.addEventListener('webkitfullscreenchange', updateFullscreenButton);
document.addEventListener('mozfullscreenchange', updateFullscreenButton);
document.addEventListener('MSFullscreenChange', updateFullscreenButton);

function updateFullscreenButton() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement || document.webkitFullscreenElement || 
        document.mozFullScreenElement || document.msFullscreenElement) {
        // In fullscreen mode - show exit icon
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#6c757d"><path d="M240-120v-120H120v-80h200v200h-80Zm400 0v-200h200v80H720v120h-80ZM120-640v-80h120v-120h80v200H120Zm520 0v-200h80v120h120v80H640Z"/></svg>';
    } else {
        // Not in fullscreen - show enter icon
        fullscreenBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#6c757d"><path d="M120-120v-200h80v120h120v80H120Zm520 0v-80h120v-120h80v200H640ZM120-640v-200h200v80H200v120h-80Zm640 0v-120H640v-80h200v200h-80Z"/></svg>';
    }
}

// Test runner is initialized via DOMContentLoaded event above
