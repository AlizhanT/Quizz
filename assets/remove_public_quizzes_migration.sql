-- Migration: Remove public_quizzes table and make quizzes table publicly readable
-- This consolidates the quiz system to use only the quizzes table

-- Step 1: Update quizzes table RLS policy to allow public read access
-- This allows anyone to view quizzes by ID (for sharing via URL)
DROP POLICY IF EXISTS "Users can view own record" ON quizzes;
DROP POLICY IF EXISTS "Public can view quizzes" ON quizzes;
CREATE POLICY "Public can view quizzes" ON quizzes
    FOR SELECT USING (true);

-- Step 2: Keep the existing policies for user operations
-- These policies ensure users can only modify their own quizzes
DROP POLICY IF EXISTS "Users can insert own quizzes" ON quizzes;
CREATE POLICY "Users can insert own quizzes" ON quizzes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
CREATE POLICY "Users can update own quizzes" ON quizzes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;
CREATE POLICY "Users can delete own quizzes" ON quizzes
    FOR DELETE USING (auth.uid() = user_id);

-- Step 3: Remove the public_quiz_id column from quizzes table (no longer needed)
ALTER TABLE quizzes DROP COLUMN IF EXISTS public_quiz_id;

-- Step 4: Drop the public_quizzes table (cleanup)
DROP TABLE IF EXISTS public_quizzes;

-- Step 5: Verify the setup
-- Check that quizzes table has the correct policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'quizzes';

-- Expected result:
-- - Public can view quizzes (SELECT, true)
-- - Users can insert own quizzes (INSERT, auth.uid() = user_id)
-- - Users can update own quizzes (UPDATE, auth.uid() = user_id)
-- - Users can delete own quizzes (DELETE, auth.uid() = user_id)
