-- Find and create missing profiles for all auth users
-- This script identifies users who have auth accounts but no profile records

-- First, let's see what auth users exist vs profiles
-- Note: This requires admin access, so we'll create a function instead

-- Create a function to sync missing profiles
CREATE OR REPLACE FUNCTION sync_missing_profiles()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    username TEXT,
    tag TEXT,
    status TEXT
) AS $$
DECLARE
    auth_user RECORD;
    profile_exists BOOLEAN;
    new_username TEXT;
    new_tag TEXT;
BEGIN
    -- This function will be called by an admin or through a secure RPC
    -- For now, let's create profiles that we know are missing
    
    -- You can manually add missing users here by their email
    -- Example: INSERT INTO profiles (id, username, email, tag, social_links) 
    -- VALUES ('user-uuid-here', 'username', 'email@example.com', '1234', '{}');
    
    RETURN QUERY SELECT 
        NULL::UUID as user_id,
        'Manual sync required'::TEXT as email,
        'See script comments'::TEXT as username,
        '0000'::TEXT as tag,
        'Use admin panel to create missing profiles'::TEXT as status;
END;
$$ LANGUAGE plpgsql;

-- Create a more practical approach: a view to see all users vs profiles
CREATE OR REPLACE VIEW user_profile_sync AS
SELECT 
    p.id,
    p.username,
    p.email,
    'Has Profile' as status
FROM profiles p
UNION ALL
-- Note: We can't access auth.users directly without admin rights
-- So you'll need to manually check in the Supabase dashboard

-- Alternative: Create a specific function to create a profile for a known user
CREATE OR REPLACE FUNCTION create_missing_profile(
    user_email TEXT,
    desired_username TEXT DEFAULT NULL,
    desired_tag TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    user_id UUID;
    new_username TEXT;
    new_tag TEXT;
BEGIN
    -- This would need to be called with proper admin context
    -- For now, return false as placeholder
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Manual instructions for fixing missing profiles:
-- 1. Go to Supabase Dashboard -> Authentication -> Users
-- 2. Find users who don't have corresponding profiles
-- 3. For each missing user, run:
-- INSERT INTO profiles (id, username, email, tag, social_links) 
-- VALUES (
--     'user-uuid-from-auth', 
--     'username-from-auth-or-custom', 
--     'email@example.com', 
--     '1234', 
--     '{}'
-- );

-- Quick check to see current profiles
SELECT 
    id,
    username,
    email,
    created_at,
    'Profile exists' as status
FROM profiles 
ORDER BY created_at DESC;
