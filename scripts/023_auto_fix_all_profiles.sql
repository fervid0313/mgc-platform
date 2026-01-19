-- AUTOMATIC FIX: Create profiles for all existing users who don't have them
-- This is a one-time fix to handle users who registered before the auto-creation was fixed

-- Step 1: Create a function to automatically generate profiles for missing users
CREATE OR REPLACE FUNCTION auto_create_missing_profiles()
RETURNS TABLE(
    user_id UUID,
    email TEXT,
    username TEXT,
    tag TEXT,
    status TEXT,
    action_taken TEXT
) AS $$
DECLARE
    user_record RECORD;
    new_username TEXT;
    new_tag TEXT;
    profiles_created INTEGER := 0;
BEGIN
    -- Create temporary table for results
    DROP TABLE IF EXISTS temp_results;
    CREATE TEMP TABLE temp_results (
        user_id UUID,
        email TEXT,
        username TEXT,
        tag TEXT,
        status TEXT,
        action_taken TEXT
    );
    
    -- Find all auth users without profiles and create profiles for them
    FOR user_record IN 
        SELECT 
            au.id,
            au.email,
            au.created_at
        FROM auth.users au
        LEFT JOIN profiles p ON au.id = p.id
        WHERE p.id IS NULL
        ORDER BY au.created_at DESC
    LOOP
        -- Generate username from email
        new_username := split_part(user_record.email, '@', 1);
        new_tag := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
        
        -- Insert the profile
        INSERT INTO profiles (
            id,
            username,
            email,
            tag,
            socialLinks,
            created_at
        ) VALUES (
            user_record.id,
            new_username,
            user_record.email,
            new_tag,
            '{}',
            user_record.created_at
        ) ON CONFLICT (id) DO NOTHING;
        
        -- Log the result
        INSERT INTO temp_results VALUES (
            user_record.id,
            user_record.email,
            new_username,
            new_tag,
            'Profile Created',
            'Auto-generated for existing user'
        );
        
        profiles_created := profiles_created + 1;
    END LOOP;
    
    -- Return results
    RETURN QUERY SELECT * FROM temp_results;
    
    -- Log completion
    RAISE NOTICE '✅ Auto-created % missing profiles', profiles_created;
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Run the automatic function
SELECT * FROM auto_create_missing_profiles();

-- Step 3: Verify the fix
SELECT 'Verification - All users should now have profiles:' as info;
SELECT 
    au.id,
    au.email,
    CASE WHEN p.id IS NOT NULL THEN '✅ Has Profile' ELSE '❌ Missing Profile' END as status,
    p.username,
    p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Step 4: Show final counts
SELECT 'Final counts:' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles;

-- Step 5: Clean up the function (optional)
-- DROP FUNCTION IF EXISTS auto_create_missing_profiles();

-- After running this, all existing users should have profiles and appear in Community
