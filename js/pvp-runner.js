// PvP Test Runner - Two Independent Players
// This file handles two separate test runners running simultaneously

// Player State Management
const playerStates = {
    1: {
        testData: null,
        currentQuestionIndex: 0,
        userAnswers: [],
        confirmedQuestions: new Set(),
        validationErrors: [],
        resizeTimeout: null
    },
    2: {
        testData: null,
        currentQuestionIndex: 0,
        userAnswers: [],
        confirmedQuestions: new Set(),
        validationErrors: [],
        resizeTimeout: null
    }
};

let globalTestData = null;

// Initialize PvP test runner
document.addEventListener('DOMContentLoaded', async () => {
    loadTestData();
    
    // Add window resize listener for dynamic font scaling
    window.addEventListener('resize', () => {
        debounceFitContent(1);
        debounceFitContent(2);
    }, { passive: true });
});

function loadTestData() {
    console.log('loadTestData() called for PvP');

    // Try to get test data from localStorage first (from pvpedit page)
    const savedData = localStorage.getItem('pvpTestData');
    console.log('LocalStorage data found:', !!savedData);
    console.log('Raw localStorage data:', savedData);

    if (savedData) {
        // Check if data is empty object
        if (savedData.trim() === '{}' || savedData.trim() === '') {
            console.error('LocalStorage contains empty object or empty string');
            localStorage.removeItem('pvpTestData'); // Clean up invalid data
            document.getElementById('questionContainer1').innerHTML = '<p>Error: Invalid test data (empty). Please go back and create a valid quiz with questions.</p>';
            document.getElementById('questionContainer2').innerHTML = '<p>Error: Invalid test data (empty). Please go back and create a valid quiz with questions.</p>';
            return;
        }

        try {
            console.log('Attempting to parse localStorage data...');
            globalTestData = JSON.parse(savedData);
            console.log('Parsed PvP test data:', globalTestData);
            console.log('Test data questions count:', globalTestData?.questions?.length);
            console.log('Test data title:', globalTestData?.title);

            // Validate the parsed data
            if (!globalTestData || typeof globalTestData !== 'object') {
                throw new Error('Parsed data is not a valid object');
            }

            // Check if it's an empty object (no properties)
            if (Object.keys(globalTestData).length === 0) {
                throw new Error('Parsed data is an empty object');
            }

            if (!globalTestData.questions || !Array.isArray(globalTestData.questions) || globalTestData.questions.length === 0) {
                throw new Error('No valid questions found in test data');
            }

            localStorage.removeItem('pvpTestData'); // Clean up

            // Initialize both players
            initializePlayer(1);
            initializePlayer(2);
        } catch (error) {
            console.error('Error parsing PvP test data:', error);
            console.error('Error details:', error.message);
            localStorage.removeItem('pvpTestData'); // Clean up invalid data
            document.getElementById('questionContainer1').innerHTML = '<p>Error loading test data: ' + error.message + '. Please go back and create a valid quiz.</p>';
            document.getElementById('questionContainer2').innerHTML = '<p>Error loading test data: ' + error.message + '. Please go back and create a valid quiz.</p>';
        }
    } else {
        console.log('No PvP test data found in localStorage');
        document.getElementById('questionContainer1').innerHTML = '<p>No test data found. Please go back and create a quiz first.</p>';
        document.getElementById('questionContainer2').innerHTML = '<p>No test data found. Please go back and create a quiz first.</p>';
    }
}

function initializePlayer(playerNum) {
    const state = playerStates[playerNum];
    
    if (!globalTestData || !globalTestData.questions || globalTestData.questions.length === 0) {
        document.getElementById(`questionContainer${playerNum}`).innerHTML = '<p>No questions available</p>';
        return;
    }

    // Filter out typing questions
    const questions = globalTestData.questions.filter(question => question.type !== 'typing');
    
    if (questions.length === 0) {
        document.getElementById(`questionContainer${playerNum}`).innerHTML = '<p>No scorable questions</p>';
        return;
    }

    // Create player-specific test data
    state.testData = {
        title: globalTestData.title,
        instructions: globalTestData.instructions,
        questions: questions.map(q => createPlayerQuestion(q, playerNum))
    };

    // Initialize user answers
    state.userAnswers = new Array(state.testData.questions.length).fill(null);
    
    // Display first question
    displayQuestion(playerNum);
    updateProgress(playerNum);
}

function createPlayerQuestion(question, playerNum) {
    const playerKey = `player${playerNum}`;

    // Create a copy of the question with player-specific data
    const playerQuestion = {
        type: question.type,
        question: question[playerKey]?.question || question.question || question.text || question.prompt,
        options: question[playerKey]?.options || question.options,
        correctAnswer: question[playerKey]?.correctAnswer !== undefined ? question[playerKey].correctAnswer : question.correctAnswer,
        sentence: question[playerKey]?.sentence || question.sentence,
        pairs: question[playerKey]?.pairs || question.pairs
    };

    return playerQuestion;
}

// Question Display Management
function displayQuestion(playerNum) {
    const state = playerStates[playerNum];
    const question = state.testData.questions[state.currentQuestionIndex];
    const container = document.getElementById(`questionContainer${playerNum}`);
    
    // Update question counter
    document.getElementById(`questionCounter${playerNum}`).textContent = 
        `${state.currentQuestionIndex + 1}/${state.testData.questions.length}`;

    // Clear previous content and validation errors
    container.innerHTML = '';
    clearValidationErrors(playerNum);

    // Validate current question
    const errors = validateCurrentQuestion(playerNum);
    if (errors.length > 0) {
        applyValidationErrors(playerNum, errors);
        return;
    }

    // Calculate and apply smart scaling BEFORE rendering
    const { questionScale, optionsScale } = calculateOptimalScale(question.type, question);
    document.documentElement.style.setProperty(`--question-scale-p${playerNum}`, questionScale.toString());
    document.documentElement.style.setProperty(`--options-scale-p${playerNum}`, optionsScale.toString());

    // Display question based on type
    const questionDisplayers = {
        'multiple': (q, c) => displayMultipleChoice(q, c, playerNum),
        'fill': (q, c) => window.displayFillInBlank(q, c, playerNum),
        'matching': (q, c) => displayMatching(q, c, playerNum)
    };
    
    const displayer = questionDisplayers[question.type];
    if (displayer) displayer(question, container);
    
    // Lock confirmed questions
    lockConfirmedQuestion(playerNum);
    updateNavigationButtons(playerNum);
}

// Helper Functions for Question Display
function createQuestionText(question, playerNum) {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-text';
    
    const questionText = getQuestionText(question);
    if (questionText) {
        questionDiv.innerHTML = questionText;
    }
    
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

function createAnswerOption(option, index, playerNum) {
    const optionText = getOptionText(option);
    const optionDiv = document.createElement('div');
    optionDiv.className = 'answer-option';
    optionDiv.onclick = () => selectAnswer(index, playerNum);
    
    optionDiv.addEventListener('click', () => clearValidationErrors(playerNum), { passive: true });
    
    const optionContent = document.createElement('div');
    optionContent.className = 'option-content';
    
    if (optionText) {
        const textSpan = document.createElement('span');
        textSpan.className = 'option-text';
        textSpan.innerHTML = optionText;
        optionContent.appendChild(textSpan);
    }
    
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

function getQuestionText(question) {
    return question?.question ?? question?.text ?? question?.prompt ?? '';
}

function getOptionText(option) {
    if (option == null) return '';
    if (typeof option === 'string') return option;
    return option.text ?? option.answer ?? option.value ?? '';
}

// Question Type Display Functions
function displayMultipleChoice(question, container, playerNum) {
    const questionText = createQuestionText(question, playerNum);
    container.appendChild(questionText);

    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'answer-options';
    optionsContainer.dataset.playerNum = playerNum;

    question.options.forEach((option, index) => {
        const optionDiv = createAnswerOption(option, index, playerNum);
        optionsContainer.appendChild(optionDiv);
    });

    container.appendChild(optionsContainer);
}

function displayMatching(question, container, playerNum) {
    const questionText = createQuestionText(question, playerNum);
    container.appendChild(questionText);

    // Check if pairs exist and are valid
    if (!question.pairs || !Array.isArray(question.pairs) || question.pairs.length === 0) {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'Error: No matching pairs available';
        errorMsg.style.color = 'red';
        container.appendChild(errorMsg);
        return;
    }

    const matchingContainer = createMatchingContainer(question, playerNum);
    container.appendChild(matchingContainer);

    // Initialize matching answers
    const state = playerStates[playerNum];
    if (!state.userAnswers[state.currentQuestionIndex]) {
        state.userAnswers[state.currentQuestionIndex] = { matches: {}, checked: false };
    }
    restoreMatchingAnswers(playerNum);
}

// Answer Selection
function selectAnswer(index, playerNum) {
    const state = playerStates[playerNum];
    const question = state.testData.questions[state.currentQuestionIndex];
    
    if (question.type !== 'multiple') return;
    
    state.userAnswers[state.currentQuestionIndex] = index;
    
    // Update UI
    const options = document.querySelectorAll(`#questionContainer${playerNum} .answer-option`);
    options.forEach((opt, i) => {
        opt.classList.remove('selected');
        if (i === index) {
            opt.classList.add('selected');
        }
    });
    
    // Check answer and provide feedback
    checkMultipleChoiceAnswer(playerNum);
}

function checkMultipleChoiceAnswer(playerNum) {
    const state = playerStates[playerNum];
    const question = state.testData.questions[state.currentQuestionIndex];
    const userAnswer = state.userAnswers[state.currentQuestionIndex];
    
    if (userAnswer === null || userAnswer === undefined) return;
    
    const correctAnswerIndex = Number(question.correctAnswer);
    const isCorrect = userAnswer === correctAnswerIndex;
    
    // Update UI with feedback
    const options = document.querySelectorAll(`#questionContainer${playerNum} .answer-option`);
    options.forEach((opt, i) => {
        if (Number.isFinite(correctAnswerIndex) && i === correctAnswerIndex) {
            opt.classList.add('correct');
        } else if (i === userAnswer && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });
    
    // Mark as confirmed
    state.confirmedQuestions.add(state.currentQuestionIndex);
    
    // Disable navigation during feedback
    disableNavigationButtons(playerNum);
    
    // Auto-advance after showing feedback
    setTimeout(() => {
        if (state.currentQuestionIndex < state.testData.questions.length - 1) {
            nextQuestion(playerNum);
        } else {
            finishTest(playerNum);
        }
    }, 1500);
}

// Navigation Functions
function nextQuestion(playerNum) {
    const state = playerStates[playerNum];
    
    if (state.currentQuestionIndex < state.testData.questions.length - 1) {
        state.currentQuestionIndex++;
        displayQuestion(playerNum);
        updateProgress(playerNum);
    }
}

function previousQuestion(playerNum) {
    const state = playerStates[playerNum];
    
    if (state.currentQuestionIndex > 0) {
        state.currentQuestionIndex--;
        displayQuestion(playerNum);
        updateProgress(playerNum);
    }
}

function restartTest(playerNum) {
    const state = playerStates[playerNum];
    
    state.currentQuestionIndex = 0;
    state.userAnswers = new Array(state.testData.questions.length).fill(null);
    state.confirmedQuestions = new Set();
    
    // Hide results, show questions
    document.getElementById(`resultsContainer${playerNum}`).classList.add('hidden');
    document.getElementById(`questionContainer${playerNum}`).classList.remove('hidden');
    
    displayQuestion(playerNum);
    updateProgress(playerNum);
}

function closeTest() {
    window.close();
    // If window.close() doesn't work (due to browser restrictions), redirect back
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 100);
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// Progress and UI Updates
function updateProgress(playerNum) {
    const state = playerStates[playerNum];
    document.getElementById(`questionCounter${playerNum}`).textContent = 
        `${state.currentQuestionIndex + 1}/${state.testData.questions.length}`;
}

function updateNavigationButtons(playerNum) {
    const state = playerStates[playerNum];
    const prevBtn = document.querySelector(`#player${playerNum}Section .btn-prev`);
    const nextBtn = document.querySelector(`#player${playerNum}Section .btn-next`);
    
    prevBtn.disabled = state.currentQuestionIndex === 0;
    nextBtn.disabled = state.currentQuestionIndex === state.testData.questions.length - 1;
}

function disableNavigationButtons(playerNum) {
    const prevBtn = document.querySelector(`#player${playerNum}Section .btn-prev`);
    const nextBtn = document.querySelector(`#player${playerNum}Section .btn-next`);
    
    prevBtn.disabled = true;
    nextBtn.disabled = true;
}

function lockConfirmedQuestion(playerNum) {
    const state = playerStates[playerNum];
    if (state.confirmedQuestions.has(state.currentQuestionIndex)) {
        // Disable all interactions for confirmed questions
        const container = document.getElementById(`questionContainer${playerNum}`);
        container.style.pointerEvents = 'none';
        container.style.opacity = '0.7';
    }
}

// Validation Functions
function validateCurrentQuestion(playerNum) {
    const state = playerStates[playerNum];
    const question = state.testData.questions[state.currentQuestionIndex];
    const errors = [];

    if (!question) {
        errors.push('Question data is missing');
        return errors;
    }

    const questionText = getQuestionText(question);
    if (!questionText || questionText.trim() === '') {
        errors.push('Question text is empty');
    }

    if (question.type === 'multiple') {
        const correctAnswer = Number(question.correctAnswer);
        if (!Number.isFinite(correctAnswer) || correctAnswer < 0) {
            errors.push('No correct answer selected for this multiple choice question');
        }
    }

    if (question.type === 'matching') {
        if (!question.pairs || !Array.isArray(question.pairs) || question.pairs.length === 0) {
            errors.push('No matching pairs defined for this question');
        }
    }

    if (question.type === 'fill') {
        if (!question.sentence || question.sentence.trim() === '') {
            errors.push('No sentence defined for this fill-in-the-blank question');
        }
        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
            errors.push('No options defined for this fill-in-the-blank question');
        }
    }

    return errors;
}

function clearValidationErrors(playerNum) {
    const container = document.getElementById(`questionContainer${playerNum}`);
    container.querySelectorAll('.validation-error').forEach(element => {
        element.classList.remove('validation-error');
    });
    
    playerStates[playerNum].validationErrors = [];
    hideNotificationPanel(playerNum);
}

function applyValidationErrors(playerNum, errors) {
    if (errors.length === 0) return;

    const container = document.getElementById(`questionContainer${playerNum}`);
    container.classList.add('validation-error');

    const question = playerStates[playerNum].testData.questions[playerStates[playerNum].currentQuestionIndex];
    if (question.type === 'multiple') {
        container.querySelectorAll('.answer-option').forEach(option => {
            option.classList.add('validation-error');
        });
    } else if (question.type === 'matching') {
        container.querySelectorAll('.matching-left-column').forEach(column => {
            column.classList.add('validation-error');
        });
    } else if (question.type === 'fill') {
        container.querySelectorAll('.fill-sentence-container').forEach(sentenceContainer => {
            sentenceContainer.classList.add('validation-error');
        });
    }

    errors.forEach(error => {
        addNotification(playerNum, error, 'error');
    });

    playerStates[playerNum].validationErrors = errors;
}

// Notification Functions
function showNotificationPanel(playerNum) {
    const panel = document.getElementById(`notificationPanel${playerNum}`);
    if (panel) {
        panel.classList.remove('hidden');
    }
}

function hideNotificationPanel(playerNum) {
    const panel = document.getElementById(`notificationPanel${playerNum}`);
    if (panel) {
        panel.classList.add('hidden');
    }
}

function addNotification(playerNum, message, type = 'error') {
    const content = document.getElementById(`notificationContent${playerNum}`);
    if (!content) return;
    
    const notification = document.createElement('div');
    notification.className = `notification-item ${type}`;
    notification.textContent = message;
    
    content.appendChild(notification);
    showNotificationPanel(playerNum);
    
    setTimeout(() => {
        notification.remove();
        if (content.children.length === 0) {
            hideNotificationPanel(playerNum);
        }
    }, 5000);
}

// Font Scaling Functions
function calculateOptimalScale(questionType, questionData) {
    let questionScale = 1;
    let optionsScale = 1;
    
    if (questionType === 'multiple') {
        const questionText = questionData.question || '';
        const maxCharsPerLine = 80;
        
        if (questionText.length > maxCharsPerLine) {
            questionScale = maxCharsPerLine / questionText.length;
            questionScale = Math.max(questionScale, 0.4);
        }
        
        const optionCount = questionData.options?.length || 0;
        if (optionCount > 4) {
            optionsScale = 0.8;
        }
    } else if (questionType === 'fill') {
        const sentenceText = questionData.sentence || '';
        const maxCharsPerLine = 90;
        
        if (sentenceText.length > maxCharsPerLine) {
            questionScale = maxCharsPerLine / sentenceText.length;
            questionScale = Math.max(questionScale, 0.4);
        }
    } else if (questionType === 'matching') {
        const pairCount = questionData.pairs?.length || 0;
        if (pairCount > 6) {
            optionsScale = 0.7;
        }
    }
    
    return { questionScale, optionsScale };
}

function debounceFitContent(playerNum) {
    const state = playerStates[playerNum];
    if (state.resizeTimeout) {
        clearTimeout(state.resizeTimeout);
    }
    state.resizeTimeout = setTimeout(() => fitContentToViewport(playerNum), 150);
}

function fitContentToViewport(playerNum) {
    const state = playerStates[playerNum];
    const question = state.testData.questions[state.currentQuestionIndex];
    const { questionScale, optionsScale } = calculateOptimalScale(question.type, question);
    
    document.documentElement.style.setProperty(`--question-scale-p${playerNum}`, questionScale.toString());
    document.documentElement.style.setProperty(`--options-scale-p${playerNum}`, optionsScale.toString());
}

// Finish Test
function finishTest(playerNum) {
    const state = playerStates[playerNum];
    
    // Calculate score
    let correctCount = 0;
    let totalQuestions = state.testData.questions.length;
    
    state.testData.questions.forEach((question, index) => {
        const userAnswer = state.userAnswers[index];
        
        if (question.type === 'multiple' && userAnswer !== null) {
            if (userAnswer === Number(question.correctAnswer)) {
                correctCount++;
            }
        } else if (question.type === 'fill') {
            if (userAnswer && userAnswer.completed) {
                correctCount++;
            }
        } else if (question.type === 'matching') {
            if (userAnswer && userAnswer.correctPairs) {
                correctCount++;
            }
        }
    });
    
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    
    // Show results
    document.getElementById(`questionContainer${playerNum}`).classList.add('hidden');
    document.getElementById(`resultsContainer${playerNum}`).classList.remove('hidden');
    document.getElementById(`scoreDisplay${playerNum}`).textContent = `${percentage}%`;
    document.getElementById(`resultsMessage${playerNum}`).textContent = 
        `You got ${correctCount} out of ${totalQuestions} questions correct.`;
}

// Matching Question Functions (adapted from test-runner.js)
function createMatchingContainer(question, playerNum) {
    const matchingContainer = document.createElement('div');
    matchingContainer.className = 'matching-container-new';
    matchingContainer.dataset.playerNum = playerNum;
    
    const leftColumn = document.createElement('div');
    leftColumn.className = 'matching-left-column';
    
    const rightColumn = document.createElement('div');
    rightColumn.className = 'matching-right-column';
    
    const leftItems = [];
    const rightItems = [];
    
    question.pairs.forEach((pair, index) => {
        const leftGroup = document.createElement('div');
        leftGroup.className = 'matching-left-group';
        
        const leftItem = document.createElement('div');
        leftItem.className = 'matching-left-item';
        leftItem.dataset.originalIndex = index;
        leftItem.dataset.playerNum = playerNum;
        
        const leftContent = document.createElement('div');
        if (pair.left) {
            leftContent.innerHTML = pair.left;
        }
        leftItem.appendChild(leftContent);
        
        const dropZone = document.createElement('div');
        dropZone.className = 'matching-drop-zone';
        dropZone.dataset.correctIndex = index;
        dropZone.dataset.occupied = 'false';
        dropZone.dataset.droppedIndex = '';
        dropZone.dataset.playerNum = playerNum;
        
        dropZone.addEventListener('dragover', handleMatchingDragOver, { passive: false });
        dropZone.addEventListener('drop', (e) => handleMatchingDrop(e, playerNum), { passive: false });
        dropZone.addEventListener('dragleave', handleMatchingDragLeave, { passive: false });
        
        dropZone.addEventListener('click', () => clearValidationErrors(playerNum), { passive: true });
        
        leftGroup.appendChild(leftItem);
        leftGroup.appendChild(dropZone);
        leftItems.push(leftGroup);
        
        const rightItem = document.createElement('div');
        rightItem.className = 'matching-right-item';
        rightItem.dataset.originalIndex = index;
        rightItem.dataset.playerNum = playerNum;
        rightItem.draggable = true;
        
        const rightContent = document.createElement('div');
        if (pair.right) {
            rightContent.innerHTML = pair.right;
        }
        rightItem.appendChild(rightContent);
        
        rightItem.addEventListener('dragstart', (e) => handleMatchingRightDragStart(e, playerNum), { passive: false });
        rightItem.addEventListener('dragend', handleMatchingRightDragEnd, { passive: false });
        
        rightItems.push(rightItem);
    });
    
    const shuffledRightItems = shuffleArray([...rightItems]);
    
    leftItems.forEach(leftGroup => leftColumn.appendChild(leftGroup));
    shuffledRightItems.forEach(rightItem => rightColumn.appendChild(rightItem));
    
    matchingContainer.appendChild(leftColumn);
    matchingContainer.appendChild(rightColumn);
    
    return matchingContainer;
}

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Matching Drag and Drop Handlers
let draggedMatchingRightElement = null;
let draggedMatchingDropZone = null;

function handleMatchingRightDragStart(e, playerNum) {
    if (e.target.dataset.playerNum != playerNum) return;
    draggedMatchingRightElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.textContent);
}

function handleMatchingRightDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedMatchingRightElement = null;
}

function handleMatchingDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const dropZone = e.currentTarget;
    if (dropZone.classList.contains('matching-drop-zone')) {
        dropZone.classList.add('drag-over');
    }
}

function handleMatchingDragLeave(e) {
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
}

function handleMatchingDrop(e, playerNum) {
    e.preventDefault();
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    if (!draggedMatchingRightElement || draggedMatchingRightElement.dataset.playerNum != playerNum) return;
    
    if (dropZone.dataset.occupied === 'true') {
        removeMatchingOptionFromDropZone(dropZone, playerNum);
    }
    
    const originalIndex = draggedMatchingRightElement.dataset.originalIndex;
    dropZone.textContent = draggedMatchingRightElement.textContent;
    dropZone.dataset.originalIndex = originalIndex;
    dropZone.dataset.occupied = 'true';
    dropZone.classList.add('filled');
    
    draggedMatchingRightElement.style.display = 'none';
    draggedMatchingRightElement.classList.add('used');
    
    const state = playerStates[playerNum];
    const correctIndex = parseInt(dropZone.dataset.correctIndex);
    if (!state.userAnswers[state.currentQuestionIndex]) {
        state.userAnswers[state.currentQuestionIndex] = { matches: {}, checked: false };
    }
    state.userAnswers[state.currentQuestionIndex].matches[correctIndex] = parseInt(originalIndex);
    
    checkAllMatchingDropZonesFilled(playerNum);
}

function removeMatchingOptionFromDropZone(dropZone, playerNum) {
    const originalIndex = dropZone.dataset.originalIndex;
    
    dropZone.textContent = '';
    dropZone.dataset.occupied = 'false';
    dropZone.classList.remove('filled');
    delete dropZone.dataset.originalIndex;
    
    document.querySelectorAll('.matching-right-item').forEach(item => {
        if (item.dataset.originalIndex === originalIndex && item.dataset.playerNum == playerNum) {
            item.style.display = '';
            item.classList.remove('used');
        }
    });
    
    const state = playerStates[playerNum];
    const correctIndex = parseInt(dropZone.dataset.correctIndex);
    if (state.userAnswers[state.currentQuestionIndex] && state.userAnswers[state.currentQuestionIndex].matches) {
        delete state.userAnswers[state.currentQuestionIndex].matches[correctIndex];
    }
    
    checkAllMatchingDropZonesFilled(playerNum);
}

function restoreMatchingAnswers(playerNum) {
    const state = playerStates[playerNum];
    const answer = state.userAnswers[state.currentQuestionIndex];
    if (!answer || !answer.matches) return;
    
    const dropZones = document.querySelectorAll(`.matching-drop-zone[data-player-num="${playerNum}"]`);
    const rightItems = document.querySelectorAll(`.matching-right-item[data-player-num="${playerNum}"]`);
    
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
    
    checkAllMatchingDropZonesFilled(playerNum);
}

function checkAllMatchingDropZonesFilled(playerNum) {
    const dropZones = document.querySelectorAll(`.matching-drop-zone[data-player-num="${playerNum}"]`);
    const allFilled = Array.from(dropZones).every(zone => zone.dataset.occupied === 'true');
    
    if (allFilled) {
        const state = playerStates[playerNum];
        const question = state.testData.questions[state.currentQuestionIndex];
        checkNewPairs(question, playerNum);
    }
}

function checkNewPairs(question, playerNum) {
    const state = playerStates[playerNum];
    const dropZones = document.querySelectorAll(`.matching-drop-zone[data-player-num="${playerNum}"]`);
    
    let correctPairs = 0;
    
    dropZones.forEach((dropZone) => {
        const correctIndex = parseInt(dropZone.dataset.correctIndex);
        const droppedIndex = dropZone.dataset.originalIndex ? parseInt(dropZone.dataset.originalIndex) : null;
        
        const existingStatus = dropZone.querySelector('.pair-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const status = document.createElement('div');
        status.className = 'pair-status';
        
        if (droppedIndex !== null && correctIndex === droppedIndex) {
            dropZone.classList.add('correct');
            dropZone.classList.remove('incorrect');
            status.classList.add('correct');
            status.classList.remove('incorrect');
            status.textContent = '✓';
            correctPairs++;
        } else {
            dropZone.classList.add('incorrect');
            dropZone.classList.remove('correct');
            status.classList.add('incorrect');
            status.classList.remove('correct');
            status.textContent = '✗';
        }
        
        dropZone.appendChild(status);
    });
    
    state.userAnswers[state.currentQuestionIndex].checked = true;
    state.userAnswers[state.currentQuestionIndex].correctPairs = correctPairs;
    
    disableNavigationButtons(playerNum);
    
    setTimeout(() => {
        if (state.currentQuestionIndex < state.testData.questions.length - 1) {
            nextQuestion(playerNum);
        } else {
            finishTest(playerNum);
        }
    }, 1500);
}
