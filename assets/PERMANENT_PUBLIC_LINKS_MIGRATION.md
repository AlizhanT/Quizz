# Permanent Public Links Migration Guide

## Overview

This migration refactors the quiz sharing system to use permanent public IDs instead of creating duplicate entries in the `public_quizzes` table every time a quiz is run or shared.

## Changes Made

### 1. Database Schema Change

**File:** `assets/add_public_quiz_id.sql`

Added a new column to the `quizzes` table:
- `public_quiz_id` (UUID) - Stores the permanent public quiz ID that references `public_quizzes.id`

**To apply:** Run the SQL in your Supabase SQL Editor before using the new system.

### 2. New Helper Function

**File:** `js/supabase-config.js`

Added `getOrCreatePublicQuizId(quiz)` function:
- Checks if the quiz already has a `public_quiz_id` in the `quizzes` table
- If it exists: Updates the existing row in `public_quizzes` with the latest quiz data
- If it doesn't exist: Creates a new row in `public_quizzes` and saves the ID to `quizzes.public_quiz_id`
- Ensures one saved quiz → one permanent public ID → one permanent share link

### 3. Updated Functions

**File:** `js/saved-quizzes.js`

- **runQuiz()**: Now uses `getOrCreatePublicQuizId()` instead of `saveQuizForRun()`
- **shareQuiz()**: Now uses `getOrCreatePublicQuizId()` instead of `saveQuizForRun()`
- **confirmDelete()**: Now calls `deletePublicQuiz()` to clean up the public quiz entry when deleting a saved quiz

**File:** `js/supabase-config.js`

- **loadQuizzesFromSupabase()**: Updated to include `public_quiz_id` in the SELECT query
- **loadQuizFromSupabase()**: Updated to include `public_quiz_id` in the SELECT query
- **deletePublicQuiz()**: New function to delete public quiz entries

## Architecture

### Before (Old System)
```
User clicks Run → saveQuizForRun() → Creates new row in public_quizzes → Returns new ID
User clicks Share → saveQuizForRun() → Creates another row in public_quizzes → Returns different ID
Result: Multiple duplicate rows, different IDs for the same quiz
```

### After (New System)
```
User clicks Run → getOrCreatePublicQuizId() → Checks quizzes.public_quiz_id
  - If exists: Updates existing public_quizzes row
  - If not exists: Creates new public_quizzes row, saves ID to quizzes.public_quiz_id
User clicks Share → getOrCreatePublicQuizId() → Same logic, reuses existing ID
Result: One quiz → One public_quiz_id → One permanent link
```

## Benefits

1. **Permanent Links**: Each quiz has exactly one permanent public link that never changes
2. **No Duplicates**: Prevents accumulation of duplicate rows in `public_quizzes`
3. **Clean Updates**: Editing a quiz updates the public quiz data without changing the link
4. **Consistent Behavior**: Run and Share buttons always use the same ID
5. **Proper Cleanup**: Deleting a quiz also removes its public quiz entry

## PvP Quizzes

PvP quizzes are **not affected** by this change. They continue to use localStorage as before:
- PvP quizzes don't have share buttons in the UI
- The share button is only shown for single-player quizzes (`quizType === 'single'`)

## Deployment Steps

1. **Run the migration SQL** in your Supabase SQL Editor:
   ```bash
   # Execute the contents of assets/add_public_quiz_id.sql
   ```

2. **Deploy the updated JavaScript files**:
   - `js/supabase-config.js`
   - `js/saved-quizzes.js`

3. **Test the system**:
   - Create a new quiz
   - Click "Run Quiz" - note the public quiz ID in console
   - Click "Share Quiz" - verify it copies the same ID
   - Edit the quiz and run/share again - verify the ID remains the same
   - Delete the quiz - verify the public quiz entry is also deleted

## Backward Compatibility

- Existing quizzes without `public_quiz_id` will get one assigned on first run/share
- Old quiz links will continue to work (they reference existing public_quizzes rows)
- The system gracefully handles missing `public_quiz_id` values

## Rollback Plan

If you need to rollback:
1. Restore the old versions of `js/supabase-config.js` and `js/saved-quizzes.js`
2. The `public_quiz_id` column can be safely left in the database (it won't affect the old system)
3. Existing public quiz links will continue to work
