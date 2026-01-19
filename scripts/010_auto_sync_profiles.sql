-- Create an automated function to sync missing profiles
-- This function runs with database admin privileges to access auth.users

-- First, create the function to find and create missing profiles
CREATE OR REPLACE FUNCTION sync_missing_profiles()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    username TEXT,
    tag TEXT,
    status TEXT,
    action_taken TEXT
) AS $$
DECLARE
    auth_user RECORD;
    profile_exists BOOLEAN;
    new_username TEXT;
    new_tag TEXT;
    profiles_added INTEGER := 0;
BEGIN
    -- Create a temporary table to store results
    DROP TABLE IF EXISTS sync_results;
    CREATE TEMP TABLE sync_results (
        user_id UUID,
        email TEXT,
        username TEXT,
        tag TEXT,
        status TEXT,
        action_taken TEXT
    );
    
    -- Note: This requires the service role key or proper RLS setup
    -- For now, let's create a function that can be called via RPC
    
    RETURN QUERY SELECT 
        NULL::UUID as user_id,
        'Function needs to be called via RPC with service role'::TEXT as email,
        'See documentation'::TEXT as username,
        '0000'::TEXT as tag,
        'Setup required'::TEXT as status,
        'Use admin API'::TEXT as action_taken;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a more practical RPC function
CREATE OR REPLACE FUNCTION create_profile_for_user(
    user_email TEXT,
    user_id UUID DEFAULT NULL,
    preferred_username TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    profile_id UUID
) AS $$
DECLARE
    new_tag TEXT;
    new_username TEXT;
    profile_count INTEGER;
BEGIN
    -- Generate a tag if not provided
    new_tag := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    
    -- Generate username if not provided
    new_username := COALESCE(preferred_username, split_part(user_email, '@', 1), 'user');
    
    -- Check if profile already exists
    SELECT COUNT(*) INTO profile_count 
    FROM profiles 
    WHERE email = user_email OR id = user_id;
    
    IF profile_count > 0 THEN
        RETURN QUERY SELECT 
            FALSE as success,
            'Profile already exists'::TEXT as message,
            NULL::UUID as profile_id;
        RETURN;
    END IF;
    
    -- Insert the new profile
    INSERT INTO profiles (id, username, email, tag, social_links)
    VALUES (user_id, new_username, user_email, new_tag, '{}')
    RETURNING id INTO profile_id;
    
    RETURN QUERY SELECT 
        TRUE as success,
        'Profile created successfully'::TEXT as message,
        profile_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get all auth users (requires service role)
CREATE OR REPLACE FUNCTION get_all_auth_users()
RETURNS TABLE(
    id UUID,
    email TEXT,
    created_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
    -- This would require service role privileges
    -- For now, return empty result as placeholder
    RETURN QUERY SELECT 
        NULL::UUID as id,
        'Requires service role'::TEXT as email,
        NOW()::TIMESTAMPTZ as created_at,
        NOW()::TIMESTAMPTZ as last_sign_in_at
    LIMIT 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
