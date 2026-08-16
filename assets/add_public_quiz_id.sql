-- Migration: Add public_quiz_id column to quizzes table
-- This allows each saved quiz to have a permanent public link

-- Add public_quiz_id column to quizzes table
ALTER TABLE quizzes 
ADD COLUMN IF NOT EXISTS public_quiz_id UUID;

-- Create index on public_quiz_id for faster lookups
CREATE INDEX IF NOT EXISTS quizzes_public_quiz_id_idx ON quizzes(public_quiz_id);

-- Add comment to document the column
COMMENT ON COLUMN quizzes.public_quiz_id IS 'Permanent ID for public quiz sharing. References public_quizzes.id';
