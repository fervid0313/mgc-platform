-- Create a database trigger to automatically create profiles for new auth users
-- This ensures every new user gets a profile immediately

-- First, create a function to generate profiles for new users
CREATE OR REPLACE FUNCTION create_profile_on_signup()
RETURNS TRIGGER AS $$
DECLARE
    new_username TEXT;
    new_tag TEXT;
BEGIN
    -- Generate username from email or use a default
    new_username := COALESCE(
        NEW.raw_user_meta_data->>'username',
        split_part(NEW.email, '@', 1),
        'user'
    );
    
    -- Generate tag from metadata or create a random one
    new_tag := COALESCE(
        NEW.raw_user_meta_data->>'tag',
        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    );
    
    -- Insert the profile
    INSERT INTO profiles (
        id,
        username,
        email,
        tag,
        social_links,
        created_at
    ) VALUES (
        NEW.id,
        new_username,
        NEW.email,
        new_tag,
        '{}',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Log the creation
    RAISE LOG 'Auto-created profile for user: % (%)', NEW.email, NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error but don't fail the auth process
        RAISE LOG 'Failed to auto-create profile for user %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
-- Note: This requires access to the auth.users table, which may need admin setup

-- Alternative approach: Create a function that can be called manually
CREATE OR REPLACE FUNCTION ensure_user_profile(user_id UUID, user_email TEXT, user_metadata JSONB DEFAULT '{}'::JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    profile_exists BOOLEAN;
    new_username TEXT;
    new_tag TEXT;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id) INTO profile_exists;
    
    IF profile_exists THEN
        RETURN TRUE; -- Profile already exists
    END IF;
    
    -- Generate username and tag
    new_username := COALESCE(
        user_metadata->>'username',
        split_part(user_email, '@', 1),
        'user'
    );
    
    new_tag := COALESCE(
        user_metadata->>'tag',
        LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
    );
    
    -- Create the profile
    INSERT INTO profiles (
        id,
        username,
        email,
        tag,
        social_links,
        created_at
    ) VALUES (
        user_id,
        new_username,
        user_email,
        new_tag,
        '{}',
        NOW()
    );
    
    RAISE LOG 'Created profile for user: % (%)', user_email, user_id;
    RETURN TRUE;
    
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Failed to create profile for user %: %', user_email, SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a view to check for users without profiles
CREATE OR REPLACE VIEW users_without_profiles AS
SELECT 
    au.id,
    au.email,
    au.created_at,
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Create a function to sync all users without profiles
CREATE OR REPLACE FUNCTION sync_all_users_without_profiles()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    success BOOLEAN,
    message TEXT
) AS $$
DECLARE
    user_record RECORD;
    sync_result BOOLEAN;
BEGIN
    -- This function would need to be called with proper privileges
    -- For now, return empty result as placeholder
    
    RETURN QUERY SELECT 
        NULL::UUID as user_id,
        'Requires admin privileges'::TEXT as email,
        FALSE as success,
        'Use manual sync or API endpoint'::TEXT as message;
END;
$$ LANGUAGE plpgsql;
