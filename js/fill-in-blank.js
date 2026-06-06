// Fill-in-the-Blank Question Module
// This module handles all fill-in-the-blank question functionality

let draggedFillElement = null;
let draggedBlankElement = null;

// Touch event handling variables
let touchItem = null;
let touchOffset = { x: 0, y: 0 };
let touchClone = null;
let isDragging = false;

// Expose variables globally for touch event handling
window.draggedFillElement = draggedFillElement;
window.draggedBlankElement = draggedBlankElement;

// Main display function for fill-in-the-blank questions
function displayFillInBlank(question, container, playerNum = null) {
    // Removed question text display - only show sentence and words
    // const questionText = createQuestionText(question);
    // container.appendChild(questionText);

    // Set player-specific context if provided
    if (playerNum) {
        container.dataset.playerNum = playerNum;
    }

    // Check if sentence and options exist and are valid
    if (!question.sentence || question.sentence.trim() === '') {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'Error: No sentence available for fill-in-the-blank question';
        errorMsg.style.color = 'red';
        container.appendChild(errorMsg);
        return;
    }

    if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
        const errorMsg = document.createElement('p');
        errorMsg.textContent = 'Error: No options available for fill-in-the-blank question';
        errorMsg.style.color = 'red';
        container.appendChild(errorMsg);
        return;
    }

    // Find words in sentence that match the options
    const sentence = question.sentence;
    const blanks = [];
    
    // Create a regex to match whole words from the options
    if (question.options && question.options.length > 0) {
        // Split sentence into words and punctuation, including mathematical operators
        const words = sentence.split(/(\s+|[.,!?;:()[\]{}"']|[+\-*/=])/);
        
        let blankIndex = 0;
        let currentPosition = 0;
        
        words.forEach((word, index) => {
            // Skip empty strings and pure punctuation/space/operators
            if (!word.trim() || /^[.,!?;:()[\]{}"']+$/.test(word) || /^\s+$/.test(word) || /^[+\-*/=]+$/.test(word)) {
                currentPosition += word.length;
                return;
            }
            
            // Check if this word matches any option (case-insensitive, exact word match)
            const cleanWord = word.toLowerCase().replace(/[.,!?;:()[\]{}"'+\-*/=]+$/, ''); // Remove trailing punctuation and operators
            const trailingPunctuation = word.match(/[.,!?;:()[\]{}"']+$/); // Capture trailing punctuation (not operators)
            const matchingOption = question.options.find(option => 
                option.toLowerCase() === cleanWord
            );
            
            if (matchingOption) {
                blanks.push({
                    word: matchingOption,
                    position: currentPosition,
                    length: word.length,
                    trailingPunctuation: trailingPunctuation ? trailingPunctuation[0] : '',
                    isValid: true,
                    blankIndex: blankIndex
                });
                
                blankIndex++;
            }
            
            currentPosition += word.length;
        });
    }
    
    // If no blanks found, create blanks for each option (fallback)
    if (blanks.length === 0 && question.options && question.options.length > 0) {
        question.options.forEach((option, index) => {
            blanks.push({
                word: option,
                position: index * 50, // Arbitrary positions
                length: option.length,
                isValid: true,
                blankIndex: index
            });
        });
    }
    
    // Sort blanks by position
    blanks.sort((a, b) => a.position - b.position);
    
    // Create sentence with blanks
    const sentenceDiv = document.createElement('div');
    sentenceDiv.className = 'fill-sentence-container';
    
    const sentenceContainer = document.createElement('div');
    sentenceContainer.className = 'fill-sentence-text';
    
    let lastIndex = 0;
    blanks.forEach((blank, index) => {
        // Add text before this blank
        if (blank.position > lastIndex) {
            const textSpan = document.createElement('span');
            textSpan.textContent = sentence.substring(lastIndex, blank.position);
            sentenceContainer.appendChild(textSpan);
        }
        
        // Create drop zone for this blank
        const dropZone = document.createElement('div');
        dropZone.className = 'blank-drop-zone';
        dropZone.dataset.blankIndex = blank.blankIndex || index;
        dropZone.dataset.correctWord = blank.word;
        dropZone.dataset.occupied = 'false';
        dropZone.dataset.playerNum = playerNum || '';
        dropZone.style.minWidth = Math.max(80, blank.word ? blank.word.length * 8 : 80) + 'px';
        dropZone.draggable = true;
        
        // Add drop event listeners
        dropZone.addEventListener('dragover', handleFillDragOver);
        dropZone.addEventListener('drop', handleFillDrop);
        dropZone.addEventListener('dragleave', handleFillDragLeave);
        
        // Add event listener to clear validation errors when user interacts
        dropZone.addEventListener('click', () => {
            if (typeof clearValidationErrors === 'function') {
                clearValidationErrors(playerNum);
            }
        });
        dropZone.addEventListener('dragover', () => {
            if (typeof clearValidationErrors === 'function') {
                clearValidationErrors(playerNum);
            }
        });
        
        // Add drag event listeners for removing options
        dropZone.addEventListener('dragstart', handleBlankDragStart);
        dropZone.addEventListener('dragend', handleBlankDragEnd);
        
        // Add touch event listeners for drop zones
        dropZone.addEventListener('touchstart', handleDropZoneTouchStart, { passive: false });
        
        sentenceContainer.appendChild(dropZone);
        
        // Add trailing punctuation after the blank if it exists
        if (blank.trailingPunctuation) {
            const punctuationSpan = document.createElement('span');
            punctuationSpan.textContent = blank.trailingPunctuation;
            sentenceContainer.appendChild(punctuationSpan);
        }
        
        lastIndex = blank.position + (blank.length || 3);
    });
    
    // Add remaining text after last blank
    if (lastIndex < sentence.length) {
        const textSpan = document.createElement('span');
        textSpan.textContent = sentence.substring(lastIndex);
        sentenceContainer.appendChild(textSpan);
    }
    
    sentenceDiv.appendChild(sentenceContainer);
    container.appendChild(sentenceDiv);
    
    // Create draggable options - create one for each blank found
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'fill-options-container';
    optionsContainer.dataset.playerNum = playerNum || '';
    
    if (question.options && question.options.length > 0 && blanks.length > 0) {
        // Count how many times each option appears in the blanks
        const optionCounts = {};
        blanks.forEach(blank => {
            const word = blank.word.toLowerCase();
            optionCounts[word] = (optionCounts[word] || 0) + 1;
        });
        
        // Create option chips for each option, repeated as many times as they appear in blanks
        question.options.forEach((option, index) => {
            const optionLower = option.toLowerCase();
            const count = optionCounts[optionLower] || 1;
            
            // Create as many chips as this option appears in the sentence
            for (let i = 0; i < count; i++) {
                const optionChip = document.createElement('div');
                optionChip.className = 'fill-option-chip';
                optionChip.draggable = true;
                optionChip.dataset.optionText = option;
                optionChip.dataset.originalIndex = `${index}-${i}`; // Use compound index to handle duplicates
                optionChip.dataset.playerNum = playerNum || '';
                optionChip.textContent = option;
                
                // Add drag event listeners
                optionChip.addEventListener('dragstart', handleFillDragStart);
                optionChip.addEventListener('dragend', handleFillDragEnd);
                
                // Add touch event listeners for immediate touch response
                optionChip.addEventListener('touchstart', handleTouchStart, { passive: false });
                
                optionsContainer.appendChild(optionChip);
            }
        });
    }
    
    container.appendChild(optionsContainer);

    // Get player-specific state
    let state;
    let currentQuestionIndex;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }
    
    // Initialize user answers if not exists
    if (!state.userAnswers[currentQuestionIndex]) {
        state.userAnswers[currentQuestionIndex] = {
            blanks: new Array(blanks.length).fill(null),
            correctWords: blanks.map(b => b.word),
            completed: false
        };
    }
    
    // Restore previous answers if any
    restoreFillAnswers(playerNum);
}

// Fill-in-the-blank drag and drop handlers for option chips
function handleFillDragStart(e) {
    window.draggedFillElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.textContent);
}

function handleFillDragEnd(e) {
    e.target.classList.remove('dragging');
    window.draggedFillElement = null;
}

// Fill-in-the-blank drag and drop handlers for blanks (to remove options)
function handleBlankDragStart(e) {
    const dropZone = e.currentTarget;
    
    // Only allow dragging if the blank is filled and not confirmed
    if (dropZone.dataset.occupied === 'true' && !dropZone.classList.contains('confirmed')) {
        window.draggedBlankElement = dropZone;
        dropZone.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', dropZone.textContent);
        
        // Create a ghost image showing the option being removed
        const ghostImage = document.createElement('div');
        ghostImage.textContent = dropZone.textContent;
        ghostImage.style.cssText = 'position: absolute; top: -1000px; left: -1000px; padding: 8px 12px; background: white; border: 2px solid black; border-radius: 8px; font-weight: 600;';
        document.body.appendChild(ghostImage);
        e.dataTransfer.setDragImage(ghostImage, 0, 0);
        setTimeout(() => ghostImage.remove(), 0);
    } else {
        e.preventDefault();
    }
}

function handleBlankDragEnd(e) {
    const dropZone = e.currentTarget;
    dropZone.classList.remove('dragging');
    
    // If the blank was dragged and dropped outside, remove the option
    if (window.draggedBlankElement === dropZone) {
        // Check if we're outside any valid drop zone
        setTimeout(() => {
            if (window.draggedBlankElement) {
                removeOptionFromBlank(dropZone);
                window.draggedBlankElement = null;
            }
        }, 10);
    }
}

function handleFillDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const dropZone = e.currentTarget;
    // Always show drag-over effect, regardless of occupation status
    if (dropZone.classList.contains('blank-drop-zone')) {
        dropZone.classList.add('drag-over');
    }
}

function handleFillDragLeave(e) {
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
}

function handleFillDrop(e) {
    e.preventDefault();
    
    const dropZone = e.currentTarget;
    dropZone.classList.remove('drag-over');
    
    // Get player number from container
    const container = dropZone.closest('.question-container');
    const playerNum = container ? container.dataset.playerNum : null;
    
    // Handle dropping a blank onto another blank (swap or remove)
    if (window.draggedBlankElement && window.draggedBlankElement !== dropZone) {
        if (window.draggedBlankElement.dataset.occupied === 'true' && dropZone.dataset.occupied === 'true') {
            swapBlankContents(window.draggedBlankElement, dropZone, playerNum);
        }
        else if (window.draggedBlankElement.dataset.occupied === 'true' && dropZone.dataset.occupied === 'false') {
            moveOptionBetweenBlanks(window.draggedBlankElement, dropZone, playerNum);
        }
        window.draggedBlankElement = null;
        return;
    }
    
    if (!window.draggedFillElement) return;
    
    if (dropZone.dataset.occupied === 'true') {
        removeOptionFromBlank(dropZone, playerNum);
    }
    
    const optionText = window.draggedFillElement.dataset.optionText;
    const originalIndex = window.draggedFillElement.dataset.originalIndex;
    
    dropZone.textContent = optionText;
    dropZone.dataset.optionText = optionText;
    dropZone.dataset.originalIndex = originalIndex;
    dropZone.dataset.occupied = 'true';
    dropZone.classList.add('filled');
    
    window.draggedFillElement.style.display = 'none';
    window.draggedFillElement.classList.add('used');
    
    // Get player-specific state
    let state;
    let currentQuestionIndex;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }
    
    const blankIndex = parseInt(dropZone.dataset.blankIndex);
    if (!state.userAnswers[currentQuestionIndex]) {
        state.userAnswers[currentQuestionIndex] = {
            blanks: [],
            correctWords: [],
            completed: false
        };
    }
    state.userAnswers[currentQuestionIndex].blanks[blankIndex] = optionText;
    
    checkAllFillBlanksFilled(playerNum);
}

function restoreFillAnswers(playerNum = null) {
    let state;
    let currentQuestionIndex;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }
    
    const answer = state.userAnswers[currentQuestionIndex];
    if (!answer || !answer.blanks) return;
    
    const selector = playerNum ? `[data-player-num="${playerNum}"]` : '';
    const dropZones = document.querySelectorAll(`.blank-drop-zone${selector}`);
    const optionChips = document.querySelectorAll(`.fill-option-chip${selector}`);
    
    answer.blanks.forEach((filledText, index) => {
        const dropZone = Array.from(dropZones).find(zone => 
            parseInt(zone.dataset.blankIndex) === index
        );
        if (dropZone && filledText) {
            dropZone.textContent = filledText;
            dropZone.dataset.occupied = 'true';
            dropZone.classList.add('filled');
            
            optionChips.forEach(chip => {
                if (chip.dataset.optionText === filledText) {
                    chip.style.display = 'none';
                    chip.classList.add('used');
                }
            });
        }
    });
    
    checkAllFillBlanksFilled(playerNum);
}

function swapBlankContents(blank1, blank2, playerNum = null) {
    const tempText = blank1.textContent;
    const tempOptionText = blank1.dataset.optionText;
    const tempOriginalIndex = blank1.dataset.originalIndex;
    
    blank1.textContent = blank2.textContent;
    blank1.dataset.optionText = blank2.dataset.optionText;
    blank1.dataset.originalIndex = blank2.dataset.originalIndex;
    
    blank2.textContent = tempText;
    blank2.dataset.optionText = tempOptionText;
    blank2.dataset.originalIndex = tempOriginalIndex;
    
    // Get player-specific state
    let state;
    let currentQuestionIndex;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }
    
    const blank1Index = parseInt(blank1.dataset.blankIndex);
    const blank2Index = parseInt(blank2.dataset.blankIndex);
    
    if (state.userAnswers[currentQuestionIndex] && state.userAnswers[currentQuestionIndex].blanks) {
        state.userAnswers[currentQuestionIndex].blanks[blank1Index] = blank1.textContent;
        state.userAnswers[currentQuestionIndex].blanks[blank2Index] = blank2.textContent;
    }
    
    checkAllFillBlanksFilled(playerNum);
}

function moveOptionBetweenBlanks(sourceBlank, targetBlank, playerNum = null) {
    const optionText = sourceBlank.textContent;
    const optionTextData = sourceBlank.dataset.optionText;
    const originalIndex = sourceBlank.dataset.originalIndex;
    
    targetBlank.textContent = optionText;
    targetBlank.dataset.optionText = optionTextData;
    targetBlank.dataset.originalIndex = originalIndex;
    targetBlank.dataset.occupied = 'true';
    targetBlank.classList.add('filled');
    
    sourceBlank.textContent = '';
    sourceBlank.dataset.occupied = 'false';
    sourceBlank.classList.remove('filled');
    delete sourceBlank.dataset.optionText;
    delete sourceBlank.dataset.originalIndex;
    
    // Get player-specific state
    let state;
    let currentQuestionIndex;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }
    
    const sourceIndex = parseInt(sourceBlank.dataset.blankIndex);
    const targetIndex = parseInt(targetBlank.dataset.blankIndex);
    
    if (state.userAnswers[currentQuestionIndex] && state.userAnswers[currentQuestionIndex].blanks) {
        state.userAnswers[currentQuestionIndex].blanks[sourceIndex] = null;
        state.userAnswers[currentQuestionIndex].blanks[targetIndex] = optionText;
    }
    
    checkAllFillBlanksFilled(playerNum);
}

function handleBlankClick(e) {
    const dropZone = e.currentTarget;
    const container = dropZone.closest('.question-container');
    const playerNum = container ? container.dataset.playerNum : null;
    
    // Only allow removal if the zone is occupied and not confirmed
    if (dropZone.dataset.occupied === 'true' && !dropZone.classList.contains('confirmed')) {
        removeOptionFromBlank(dropZone, playerNum);
    }
}

function removeOptionFromBlank(dropZone, playerNum = null) {
    const optionText = dropZone.textContent;
    
    dropZone.textContent = '';
    dropZone.dataset.occupied = 'false';
    dropZone.classList.remove('filled');
    delete dropZone.dataset.optionText;
    delete dropZone.dataset.originalIndex;
    
    const selector = playerNum ? `[data-player-num="${playerNum}"]` : '';
    document.querySelectorAll(`.fill-option-chip${selector}`).forEach(chip => {
        if (chip.dataset.optionText === optionText) {
            chip.style.display = '';
            chip.classList.remove('used');
        }
    });
    
    // Get player-specific state
    let state;
    let currentQuestionIndex;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }
    
    const blankIndex = parseInt(dropZone.dataset.blankIndex);
    if (state.userAnswers[currentQuestionIndex] && state.userAnswers[currentQuestionIndex].blanks) {
        state.userAnswers[currentQuestionIndex].blanks[blankIndex] = null;
    }
    
    checkAllFillBlanksFilled(playerNum);
}

function checkAllFillBlanksFilled(playerNum = null) {
    const selector = playerNum ? `[data-player-num="${playerNum}"]` : '';
    const dropZones = document.querySelectorAll(`.blank-drop-zone${selector}`);
    const allFilled = Array.from(dropZones).every(zone => zone.dataset.occupied === 'true');
    
    if (allFilled) {
        confirmFillBlank(playerNum);
    }
}

function confirmFillBlank(playerNum = null) {
    const selector = playerNum ? `[data-player-num="${playerNum}"]` : '';
    const dropZones = document.querySelectorAll(`.blank-drop-zone${selector}`);
    const allFilled = Array.from(dropZones).every(zone => zone.dataset.occupied === 'true');
    
    if (!allFilled) {
        return;
    }
    
    // Get player-specific state
    let state;
    let currentQuestionIndex;
    let testData;
    let confirmedQuestions;
    
    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
        testData = state.testData;
        confirmedQuestions = state.confirmedQuestions;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
        testData = window.testData;
        confirmedQuestions = window.confirmedQuestions;
    }
    
    dropZones.forEach((zone) => {
        const correctWord = zone.dataset.correctWord ? zone.dataset.correctWord.toLowerCase().trim() : '';
        const droppedWord = zone.dataset.optionText ? zone.dataset.optionText.toLowerCase().trim() : '';
        
        const existingStatus = zone.querySelector('.word-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        const status = document.createElement('div');
        status.className = 'word-status';
        
        if (correctWord === droppedWord) {
            zone.classList.add('correct');
            zone.classList.remove('incorrect');
            status.classList.add('correct');
            status.classList.remove('incorrect');
            status.textContent = '✓';
        } else {
            zone.classList.add('incorrect');
            zone.classList.remove('correct');
            status.classList.add('incorrect');
            status.classList.remove('correct');
            status.textContent = '✗';
        }
        
        zone.appendChild(status);
    });
    
    state.userAnswers[currentQuestionIndex].completed = true;
    confirmedQuestions.add(currentQuestionIndex);
    
    if (playerNum && typeof disableNavigationButtons === 'function') {
        disableNavigationButtons(playerNum);
    }
    
    document.querySelectorAll(`.fill-option-chip${selector}`).forEach(chip => {
        chip.draggable = false;
        chip.style.cursor = 'default';
    });
    
    document.querySelectorAll(`.blank-drop-zone${selector}`).forEach(zone => {
        zone.style.cursor = 'default';
        zone.classList.add('confirmed');
    });
    
    setTimeout(() => {
        if (playerNum) {
            if (currentQuestionIndex < testData.questions.length - 1) {
                nextQuestion(playerNum);
            } else {
                finishTest(playerNum);
            }
        } else {
            if (currentQuestionIndex < testData.questions.length - 1) {
                nextQuestion();
            } else {
                finishTest();
            }
        }
    }, 1500);
}

// Export the main function for use in test-runner.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { displayFillInBlank };
}

// Touch event handlers for drop zones (to allow removing options on touch devices)
function handleDropZoneTouchStart(e) {
    const dropZone = e.target.closest('.blank-drop-zone.filled');

    if (!dropZone || dropZone.classList.contains('confirmed')) return;

    e.preventDefault();

    // Get player number from container
    const container = dropZone.closest('.question-container');
    const playerNum = container ? container.dataset.playerNum : null;

    // Start dragging the filled option
    touchItem = dropZone;
    const touch = e.touches[0];
    const rect = dropZone.getBoundingClientRect();
    touchOffset.x = touch.clientX - rect.left;
    touchOffset.y = touch.clientY - rect.top;

    // Create visual feedback
    dropZone.style.opacity = '0.5';
    dropZone.style.transform = 'scale(0.95)';

    // Add touch event listeners
    document.addEventListener('touchmove', handleDropZoneTouchMove, { passive: false });
    document.addEventListener('touchend', handleDropZoneTouchEnd, { passive: false });

    isDragging = true;
}

function handleDropZoneTouchMove(e) {
    if (!isDragging || !touchItem) return;
    e.preventDefault();

    const touch = e.touches[0];

    // Create clone element if not exists
    if (!touchClone) {
        touchClone = document.createElement('div');
        touchClone.textContent = touchItem.textContent;
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '10000';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.8';
        touchClone.style.padding = '8px 12px';
        touchClone.style.background = 'white';
        touchClone.style.border = '2px solid black';
        touchClone.style.borderRadius = '8px';
        touchClone.style.fontWeight = '600';

        // Copy the original element's dimensions and styling
        const rect = touchItem.getBoundingClientRect();
        touchClone.style.width = rect.width + 'px';
        touchClone.style.height = rect.height + 'px';
        touchClone.style.minWidth = rect.width + 'px';
        touchClone.style.minHeight = rect.height + 'px';
        touchClone.style.display = 'flex';
        touchClone.style.alignItems = 'center';
        touchClone.style.justifyContent = 'center';
        touchClone.style.fontSize = window.getComputedStyle(touchItem).fontSize;
        touchClone.style.fontFamily = window.getComputedStyle(touchItem).fontFamily;

        document.body.appendChild(touchClone);
    }

    // Update clone position
    touchClone.style.left = (touch.clientX - touchOffset.x) + 'px';
    touchClone.style.top = (touch.clientY - touchOffset.y) + 'px';

    // Find valid drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = elementBelow?.closest('.blank-drop-zone');

    // Update visual feedback
    document.querySelectorAll('.drag-over').forEach(zone => {
        zone.classList.remove('drag-over');
    });

    if (dropTarget && dropTarget !== touchItem) {
        dropTarget.classList.add('drag-over');
    }
}

function handleDropZoneTouchEnd(e) {
    if (!isDragging || !touchItem) return;
    e.preventDefault();

    const touch = e.changedTouches[0];

    // Get player number from container
    const container = touchItem.closest('.question-container');
    const playerNum = container ? container.dataset.playerNum : null;

    // Find drop target
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropTarget = elementBelow?.closest('.blank-drop-zone');

    // Handle drop
    if (dropTarget && dropTarget !== touchItem) {
        if (touchItem.dataset.occupied === 'true' && dropTarget.dataset.occupied === 'true') {
            swapBlankContents(touchItem, dropTarget, playerNum);
        } else if (touchItem.dataset.occupied === 'true' && dropTarget.dataset.occupied === 'false') {
            moveOptionBetweenBlanks(touchItem, dropTarget, playerNum);
        }
    } else if (!dropTarget) {
        // Dropped outside - remove the option
        removeOptionFromBlank(touchItem, playerNum);
    }

    // Clean up
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }

    if (touchItem) {
        touchItem.style.opacity = '';
        touchItem.style.transform = '';
        touchItem = null;
    }

    // Remove drag-over classes
    document.querySelectorAll('.drag-over').forEach(zone => {
        zone.classList.remove('drag-over');
    });

    // Remove event listeners
    document.removeEventListener('touchmove', handleDropZoneTouchMove);
    document.removeEventListener('touchend', handleDropZoneTouchEnd);

    isDragging = false;
}

// Touch event handlers for option chips (to allow dragging on touch devices)
function handleTouchStart(e) {
    const touch = e.touches[0];
    const target = e.target.closest('.fill-option-chip');

    if (!target) return;

    e.preventDefault();
    touchItem = target;
    const rect = target.getBoundingClientRect();
    touchOffset.x = touch.clientX - rect.left;
    touchOffset.y = touch.clientY - rect.top;

    // Create visual feedback
    target.style.opacity = '0.5';
    target.style.transform = 'scale(0.95)';

    // Add touch event listeners
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    isDragging = true;
}

function handleTouchMove(e) {
    if (!isDragging || !touchItem) return;
    e.preventDefault();

    const touch = e.touches[0];

    // Create clone element if not exists
    if (!touchClone) {
        touchClone = touchItem.cloneNode(true);
        touchClone.style.position = 'fixed';
        touchClone.style.zIndex = '10000';
        touchClone.style.pointerEvents = 'none';
        touchClone.style.opacity = '0.8';
        touchClone.style.transform = 'rotate(5deg)';

        // Copy the original element's dimensions
        const rect = touchItem.getBoundingClientRect();
        touchClone.style.width = rect.width + 'px';
        touchClone.style.height = rect.height + 'px';
        touchClone.style.minWidth = rect.width + 'px';
        touchClone.style.minHeight = rect.height + 'px';
        touchClone.style.maxWidth = rect.width + 'px';
        touchClone.style.maxHeight = rect.height + 'px';

        document.body.appendChild(touchClone);
    }

    // Update clone position
    touchClone.style.left = (touch.clientX - touchOffset.x) + 'px';
    touchClone.style.top = (touch.clientY - touchOffset.y) + 'px';

    // Find drop zone under touch
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementBelow?.closest('.blank-drop-zone');

    // Update drop zone visual feedback
    document.querySelectorAll('.drag-over').forEach(zone => {
        zone.classList.remove('drag-over');
    });

    if (dropZone) {
        dropZone.classList.add('drag-over');
    }
}

function handleTouchEnd(e) {
    if (!isDragging || !touchItem) return;
    e.preventDefault();

    const touch = e.changedTouches[0];

    // Get player number from container
    const container = touchItem.closest('.fill-options-container');
    const playerNum = container ? container.dataset.playerNum : null;

    // Find drop zone under touch
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const dropZone = elementBelow?.closest('.blank-drop-zone');

    // Handle drop
    if (dropZone && touchItem) {
        handleTouchDrop(touchItem, dropZone, playerNum);
    }

    // Clean up
    if (touchClone) {
        touchClone.remove();
        touchClone = null;
    }

    if (touchItem) {
        touchItem.style.opacity = '';
        touchItem.style.transform = '';
        touchItem = null;
    }

    // Remove drag-over classes
    document.querySelectorAll('.drag-over').forEach(zone => {
        zone.classList.remove('drag-over');
    });

    // Remove event listeners
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);

    isDragging = false;
}

function handleTouchDrop(item, dropZone, playerNum = null) {
    // Get player number from container if not provided
    if (!playerNum) {
        const container = dropZone.closest('.question-container');
        playerNum = container ? container.dataset.playerNum : null;
    }

    // If the drop zone is already occupied, remove the existing option first
    if (dropZone.dataset.occupied === 'true') {
        removeOptionFromBlank(dropZone, playerNum);
    }

    const optionText = item.dataset.optionText;
    const originalIndex = item.dataset.originalIndex;

    dropZone.textContent = optionText;
    dropZone.dataset.optionText = optionText;
    dropZone.dataset.originalIndex = originalIndex;
    dropZone.dataset.occupied = 'true';
    dropZone.classList.add('filled');

    item.style.display = 'none';
    item.classList.add('used');

    // Get player-specific state
    let state;
    let currentQuestionIndex;

    if (playerNum && typeof playerStates !== 'undefined' && playerStates[playerNum]) {
        state = playerStates[playerNum];
        currentQuestionIndex = state.currentQuestionIndex;
    } else {
        state = { userAnswers: userAnswers };
        currentQuestionIndex = window.currentQuestionIndex;
    }

    const blankIndex = parseInt(dropZone.dataset.blankIndex);
    if (!state.userAnswers[currentQuestionIndex]) {
        state.userAnswers[currentQuestionIndex] = {
            blanks: [],
            correctWords: [],
            completed: false
        };
    }
    state.userAnswers[currentQuestionIndex].blanks[blankIndex] = optionText;

    checkAllFillBlanksFilled(playerNum);
}
