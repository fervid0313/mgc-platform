-- TARGETED FIX: Fix the remaining profile that's still using email fallback
-- This will update the last profile to use auth username

-- Step 1: Find the profile that's still using email as username
SELECT 'Profile still using email as username:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN p.username = p.email OR p.username LIKE '%@%' THEN '❌ Using email'
        ELSE '✅ Using proper username'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.username = p.email OR p.username LIKE '%@%'
ORDER BY p.created_at DESC;

-- Step 2: Update the remaining profile to use auth username
UPDATE profiles p
SET username = au.raw_user_meta_data->>'username'
FROM auth.users au
WHERE p.id = au.id
    AND (p.username = p.email OR p.username LIKE '%@%')
    AND au.raw_user_meta_data->>'username' IS NOT NULL
    AND p.username != au.raw_user_meta_data->>'username';

-- Step 3: Verify the fix
SELECT 'Verification - All profiles should now use auth usernames:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN p.username = au.raw_user_meta_data->>'username' THEN '✅ Match'
        ELSE '❌ Still using fallback'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;

-- Step 4: Show final count
SELECT 'Final count:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE p.username = au.raw_user_meta_data->>'username') as auth_username_count,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE p.username != au.raw_user_meta_data->>'username') as fallback_count;
