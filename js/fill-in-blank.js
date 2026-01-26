// Fill-in-the-Blank Question Module
// This module handles all fill-in-the-blank question functionality

let draggedFillElement = null;
let draggedBlankElement = null;

// Main display function for fill-in-the-blank questions
function displayFillInBlank(question, container) {
    // Removed question text display - only show sentence and words
    // const questionText = createQuestionText(question);
    // container.appendChild(questionText);

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
        dropZone.style.minWidth = Math.max(80, blank.word ? blank.word.length * 8 : 80) + 'px';
        dropZone.draggable = true;
        
        // Add drop event listeners
        dropZone.addEventListener('dragover', handleFillDragOver);
        dropZone.addEventListener('drop', handleFillDrop);
        dropZone.addEventListener('dragleave', handleFillDragLeave);
        
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
        dropZone.addEventListener('dragstart', handleBlankDragStart);
        dropZone.addEventListener('dragend', handleBlankDragEnd);
        
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
                optionChip.textContent = option;
                
                // Add drag event listeners
                optionChip.addEventListener('dragstart', handleFillDragStart);
                optionChip.addEventListener('dragend', handleFillDragEnd);
                
                optionsContainer.appendChild(optionChip);
            }
        });
    }
    
    container.appendChild(optionsContainer);

    // Initialize user answers if not exists
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = {
            blanks: new Array(blanks.length).fill(null),
            correctWords: blanks.map(b => b.word),
            completed: false
        };
    }
    
    // Restore previous answers if any
    restoreFillAnswers();
    
    addConfirmButton(container, confirmFillBlank);
}

// Fill-in-the-blank drag and drop handlers for option chips
function handleFillDragStart(e) {
    draggedFillElement = e.target;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.textContent);
}

function handleFillDragEnd(e) {
    e.target.classList.remove('dragging');
}

// Fill-in-the-blank drag and drop handlers for blanks (to remove options)
function handleBlankDragStart(e) {
    const dropZone = e.currentTarget;
    
    // Only allow dragging if the blank is filled and not confirmed
    if (dropZone.dataset.occupied === 'true' && !dropZone.classList.contains('confirmed')) {
        draggedBlankElement = dropZone;
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

function handleBlankDragEnd(e) {
    const dropZone = e.currentTarget;
    dropZone.classList.remove('dragging');
    
    // If the blank was dragged and dropped outside, remove the option
    if (draggedBlankElement === dropZone) {
        // Check if we're outside any valid drop zone
        setTimeout(() => {
            if (draggedBlankElement) {
                removeOptionFromBlank(dropZone);
                draggedBlankElement = null;
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
    
    // Handle dropping a blank onto another blank (swap or remove)
    if (draggedBlankElement && draggedBlankElement !== dropZone) {
        // If both blanks are filled, swap their contents
        if (draggedBlankElement.dataset.occupied === 'true' && dropZone.dataset.occupied === 'true') {
            swapBlankContents(draggedBlankElement, dropZone);
        }
        // If dragging a filled blank onto an empty one, move the option
        else if (draggedBlankElement.dataset.occupied === 'true' && dropZone.dataset.occupied === 'false') {
            moveOptionBetweenBlanks(draggedBlankElement, dropZone);
        }
        draggedBlankElement = null;
        return;
    }
    
    if (!draggedFillElement) return;
    
    // If the drop zone is already occupied, remove the existing option first
    if (dropZone.dataset.occupied === 'true') {
        removeOptionFromBlank(dropZone);
    }
    
    // Place the option in the blank
    const optionText = draggedFillElement.dataset.optionText;
    const originalIndex = draggedFillElement.dataset.originalIndex;
    
    dropZone.textContent = optionText;
    dropZone.dataset.optionText = optionText;
    dropZone.dataset.originalIndex = originalIndex;
    dropZone.dataset.occupied = 'true';
    dropZone.classList.add('filled');
    
    // Hide the dragged option
    draggedFillElement.style.display = 'none';
    draggedFillElement.classList.add('used');
    
    // Update user answers
    const blankIndex = parseInt(dropZone.dataset.blankIndex);
    if (!userAnswers[currentQuestionIndex]) {
        userAnswers[currentQuestionIndex] = {
            blanks: [],
            correctWords: [],
            completed: false
        };
    }
    userAnswers[currentQuestionIndex].blanks[blankIndex] = optionText;
    
    // Check if all blanks are filled
    checkAllBlanksFilled();
}

function restoreFillAnswers() {
    const answer = userAnswers[currentQuestionIndex];
    if (!answer || !answer.blanks) return;
    
    const dropZones = document.querySelectorAll('.blank-drop-zone');
    const optionChips = document.querySelectorAll('.fill-option-chip');
    
    answer.blanks.forEach((filledText, index) => {
        const dropZone = Array.from(dropZones).find(zone => 
            parseInt(zone.dataset.blankIndex) === index
        );
        if (dropZone && filledText) {
            dropZone.textContent = filledText;
            dropZone.dataset.occupied = 'true';
            dropZone.classList.add('filled');
            
            // Find and hide the corresponding option
            optionChips.forEach(chip => {
                if (chip.dataset.optionText === filledText) {
                    chip.style.display = 'none';
                    chip.classList.add('used');
                }
            });
        }
    });
    
    checkAllBlanksFilled();
}

function swapBlankContents(blank1, blank2) {
    const tempText = blank1.textContent;
    const tempOptionText = blank1.dataset.optionText;
    const tempOriginalIndex = blank1.dataset.originalIndex;
    
    blank1.textContent = blank2.textContent;
    blank1.dataset.optionText = blank2.dataset.optionText;
    blank1.dataset.originalIndex = blank2.dataset.originalIndex;
    
    blank2.textContent = tempText;
    blank2.dataset.optionText = tempOptionText;
    blank2.dataset.originalIndex = tempOriginalIndex;
    
    // Update user answers
    const blank1Index = parseInt(blank1.dataset.blankIndex);
    const blank2Index = parseInt(blank2.dataset.blankIndex);
    
    if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].blanks) {
        userAnswers[currentQuestionIndex].blanks[blank1Index] = blank1.textContent;
        userAnswers[currentQuestionIndex].blanks[blank2Index] = blank2.textContent;
    }
    
    // Check if all blanks are filled
    checkAllBlanksFilled();
}

function moveOptionBetweenBlanks(sourceBlank, targetBlank) {
    const optionText = sourceBlank.textContent;
    const optionTextData = sourceBlank.dataset.optionText;
    const originalIndex = sourceBlank.dataset.originalIndex;
    
    // Move to target
    targetBlank.textContent = optionText;
    targetBlank.dataset.optionText = optionTextData;
    targetBlank.dataset.originalIndex = originalIndex;
    targetBlank.dataset.occupied = 'true';
    targetBlank.classList.add('filled');
    
    // Clear source
    sourceBlank.textContent = '';
    sourceBlank.dataset.occupied = 'false';
    sourceBlank.classList.remove('filled');
    delete sourceBlank.dataset.optionText;
    delete sourceBlank.dataset.originalIndex;
    
    // Update user answers
    const sourceIndex = parseInt(sourceBlank.dataset.blankIndex);
    const targetIndex = parseInt(targetBlank.dataset.blankIndex);
    
    if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].blanks) {
        userAnswers[currentQuestionIndex].blanks[sourceIndex] = null;
        userAnswers[currentQuestionIndex].blanks[targetIndex] = optionText;
    }
    
    // Check if all blanks are filled
    checkAllBlanksFilled();
}

function handleBlankClick(e) {
    const dropZone = e.currentTarget;
    
    // Only allow removal if the zone is occupied and not confirmed
    if (dropZone.dataset.occupied === 'true' && !dropZone.classList.contains('confirmed')) {
        removeOptionFromBlank(dropZone);
    }
}

function removeOptionFromBlank(dropZone) {
    const optionText = dropZone.textContent;
    
    // Clear the drop zone
    dropZone.textContent = '';
    dropZone.dataset.occupied = 'false';
    dropZone.classList.remove('filled');
    delete dropZone.dataset.optionText;
    delete dropZone.dataset.originalIndex;
    
    // Find and show the corresponding option chip
    document.querySelectorAll('.fill-option-chip').forEach(chip => {
        if (chip.dataset.optionText === optionText) {
            chip.style.display = '';
            chip.classList.remove('used');
        }
    });
    
    // Update user answers
    const blankIndex = parseInt(dropZone.dataset.blankIndex);
    if (userAnswers[currentQuestionIndex] && userAnswers[currentQuestionIndex].blanks) {
        userAnswers[currentQuestionIndex].blanks[blankIndex] = null;
    }
    
    // Check if all blanks are filled
    checkAllBlanksFilled();
}

function checkAllBlanksFilled() {
    const dropZones = document.querySelectorAll('.blank-drop-zone');
    const allFilled = Array.from(dropZones).every(zone => zone.dataset.occupied === 'true');
    
    // Enable/disable confirm button based on whether all blanks are filled
    const confirmBtn = document.querySelector('.action-btn');
    if (confirmBtn) {
        confirmBtn.disabled = !allFilled;
        confirmBtn.textContent = allFilled ? 'Confirm Answer' : 'Fill all blanks first';
    }
}

function confirmFillBlank() {
    const dropZones = document.querySelectorAll('.blank-drop-zone');
    const allFilled = Array.from(dropZones).every(zone => zone.dataset.occupied === 'true');
    
    if (!allFilled) {
        const confirmBtn = document.querySelector('.action-btn');
        if (confirmBtn) {
            confirmBtn.textContent = 'Please fill all blanks first';
            setTimeout(() => {
                confirmBtn.textContent = 'Please fill all blanks first';
            }, 2000);
        }
        return;
    }
    
    // Mark question as completed
    userAnswers[currentQuestionIndex].completed = true;
    confirmedQuestions.add(currentQuestionIndex);
    
    // Disable navigation buttons during confirmation wait
    if (typeof disableNavigationButtons === 'function') {
        disableNavigationButtons();
    }
    
    // Check each drop zone and show feedback
    dropZones.forEach((zone) => {
        const correctWord = zone.dataset.correctWord;
        const userWord = zone.textContent;
        const isCorrect = userWord.toLowerCase().trim() === correctWord.toLowerCase().trim();
        
        if (isCorrect) {
            zone.classList.add('correct');
            zone.classList.remove('incorrect');
        } else {
            zone.classList.add('incorrect');
            zone.classList.remove('correct');
        }
    });
    
    // Show feedback on options
    document.querySelectorAll('.fill-option-chip').forEach(chip => {
        const optionText = chip.dataset.optionText;
        const dropZoneWithOption = Array.from(dropZones).find(zone => zone.textContent === optionText);
        const isCorrectOption = dropZoneWithOption && dropZoneWithOption.classList.contains('correct');
        
        if (isCorrectOption) {
            chip.classList.add('correct-feedback');
            chip.classList.remove('incorrect-feedback');
        } else {
            chip.classList.add('incorrect-feedback');
            chip.classList.remove('correct-feedback');
        }
    });
    
    // Disable all drag and drop
    document.querySelectorAll('.fill-option-chip').forEach(chip => {
        chip.draggable = false;
        chip.style.cursor = 'default';
    });
    
    document.querySelectorAll('.blank-drop-zone').forEach(zone => {
        zone.style.cursor = 'default';
        zone.classList.add('confirmed');
    });
    
    // Disable confirm button
    const confirmBtn = document.querySelector('.action-btn');
    if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Answer Confirmed';
        confirmBtn.style.background = '#6c757d';
    }
    
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

// Export the main function for use in test-runner.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { displayFillInBlank };
}
