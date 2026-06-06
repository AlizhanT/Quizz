-- RPC Function to Create User Record if Not Exists
-- This function should be created in your Supabase database SQL Editor

-- Create the RPC function that creates user records
CREATE OR REPLACE FUNCTION create_user_if_not_exists(user_id UUID, user_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record_id UUID;
    result_message TEXT;
BEGIN
    -- Check if user already exists
    SELECT id INTO user_record_id FROM users WHERE id = user_id;
    
    IF user_record_id IS NOT NULL THEN
        result_message := 'User record already exists';
        RETURN result_message;
    END IF;
    
    -- Insert new user record
    INSERT INTO users (id, email, created_at)
    VALUES (user_id, user_email, NOW())
    ON CONFLICT (id) DO NOTHING;
    
    result_message := 'User record created successfully';
    
    -- Log the creation (optional)
    RAISE NOTICE 'User % created via RPC function', user_id;
    
    RETURN result_message;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error message if something goes wrong
        RETURN 'Error creating user: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_if_not_exists TO authenticated;
GRANT EXECUTE ON FUNCTION create_user_if_not_exists TO service_role;

-- Note: Make sure the 'users' table exists with the following structure:
-- CREATE TABLE IF NOT EXISTS users (
--     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     email TEXT NOT NULL,
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- Enable Row Level Security
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own record
-- CREATE POLICY "Users can view own record" ON users
--     FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to insert their own record
-- CREATE POLICY "Users can insert own record" ON users
--     FOR INSERT WITH CHECK (auth.uid() = id);
