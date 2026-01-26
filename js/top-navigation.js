// Top Navigation Functions

// Go home - only if quiz is saved
function goHome() {
    if (currentEditingQuizId) {
        // Quiz is saved, go to saved quizzes
        window.location.href = 'saved-quizzes.html';
    } else {
        // Quiz is not saved, show save reminder modal
        showSaveReminderModal(() => {
            // After saving, check if it was successful
            setTimeout(() => {
                if (currentEditingQuizId) {
                    window.location.href = 'saved-quizzes.html';
                }
            }, 1000);
        }, () => {
            // User clicked "Don't Save", go to saved quizzes anyway
            window.location.href = 'saved-quizzes.html';
        });
    }
}
