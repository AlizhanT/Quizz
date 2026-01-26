-- RPC Function to Delete User Account (including auth)
-- This function should be created in your Supabase database SQL Editor

-- First, create the RPC function that can delete auth users
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

-- Alternative: If you can't use SECURITY DEFINER, create a simpler version
-- that only handles custom tables and requires manual auth deletion

-- You can also create this version for additional safety:
CREATE OR REPLACE FUNCTION delete_user_data_only(user_id_to_delete UUID)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete from custom tables (safer version)
    DELETE FROM quizzes WHERE user_id = user_id_to_delete;
    DELETE FROM quiz_autosaves WHERE user_id = user_id_to_delete;
    DELETE FROM users WHERE id = user_id_to_delete;
    
    RETURN 'User data deleted from custom tables. Auth user must be deleted separately.';
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'Error deleting user data: ' || SQLERRM;
END;
$$;

-- Grant execute permission for the safer version
GRANT EXECUTE ON FUNCTION delete_user_data_only TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_data_only TO service_role;
