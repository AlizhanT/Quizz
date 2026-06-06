# Database Setup Instructions

To fix the user registration issue, you need to set up your Supabase database properly. Follow these steps:

## 1. Create the users table

Go to your Supabase project's SQL Editor and run the following SQL:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see their own record
CREATE POLICY "Users can view own record" ON users
    FOR SELECT USING (auth.uid() = id);

-- Create policy to allow users to insert their own record
CREATE POLICY "Users can insert own record" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own record
CREATE POLICY "Users can update own record" ON users
    FOR UPDATE USING (auth.uid() = id);
```

## 2. Create the RPC function for user creation

Run the SQL from `assets/create_user_rpc.sql` in your Supabase SQL Editor:

```sql
-- RPC Function to Create User Record if Not Exists
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
```

## 3. Create the RPC function for user deletion (optional)

If you want account deletion to work properly, also run the SQL from `assets/delete_user_rpc.sql`:

```sql
-- RPC Function to Delete User Account (including auth)
CREATE OR REPLACE FUNCTION delete_user_account(user_id_to_delete UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deletion_result TEXT;
BEGIN
    -- Check if the user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id_to_delete) THEN
        -- Delete the user from auth.users (this will cascade delete all related data)
        DELETE FROM auth.users WHERE id = user_id_to_delete;
        
        deletion_result := 'User account deleted successfully from auth system';
        
        -- Log the deletion (optional)
        RAISE NOTICE 'User % deleted via RPC function', user_id_to_delete;
        
        RETURN deletion_result;
    ELSE
        RETURN 'User not found in auth system';
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Return error message if something goes wrong
        RETURN 'Error deleting user: ' || SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_account TO service_role;
```

## 4. Verify email confirmation settings

In your Supabase project:
1. Go to Authentication → Providers
2. Click on Email provider
3. Ensure "Confirm email" is either:
   - **Enabled** (recommended for production) - users must verify email before signing in
   - **Disabled** (for testing) - users can sign in immediately

## 5. Test the registration

After completing the database setup:
1. Clear your browser cache and localStorage
2. Go to your welcome page
3. Try to register a new user
4. Check the browser console for any errors
5. Verify the user appears in your Supabase dashboard under Authentication → Users
6. Verify the user record appears in your Supabase dashboard under Table Editor → users

## Troubleshooting

If registration still fails:
1. Check browser console for error messages
2. Check Supabase logs in your project dashboard
3. Ensure the RPC functions exist: `create_user_if_not_exists` and `delete_user_account`
4. Ensure the users table exists and has proper RLS policies
5. Verify your Supabase URL and anon key in `js/supabase-config.js` are correct
