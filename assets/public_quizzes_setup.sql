-- Create public_quizzes table for shareable quiz links
-- This table allows quizzes to be shared via URL without requiring authentication

-- Create the public_quizzes table
CREATE TABLE IF NOT EXISTS public_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    instructions TEXT,
    quiz_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public_quizzes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access (anyone can view quizzes by ID)
CREATE POLICY "Public can view quizzes" ON public_quizzes
    FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert quizzes
CREATE POLICY "Authenticated users can insert quizzes" ON public_quizzes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update their own quizzes
CREATE POLICY "Authenticated users can update quizzes" ON public_quizzes
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Create index on created_at for better query performance
CREATE INDEX IF NOT EXISTS public_quizzes_created_at_idx ON public_quizzes(created_at DESC);

-- Create index on updated_at for better query performance
CREATE INDEX IF NOT EXISTS public_quizzes_updated_at_idx ON public_quizzes(updated_at DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON TABLE public_quizzes TO authenticated;
GRANT SELECT ON TABLE public_quizzes TO anon;
