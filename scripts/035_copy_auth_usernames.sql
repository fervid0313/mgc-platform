-- SIMPLE FIX: Copy auth usernames to profile usernames
-- This will make profile.username match the actual username from auth metadata

-- Step 1: Update all profiles to use the auth username
UPDATE profiles p
SET username = au.raw_user_meta_data->>'username'
FROM auth.users au
WHERE p.id = au.id
    AND au.raw_user_meta_data->>'username' IS NOT NULL
    AND p.username != au.raw_user_meta_data->>'username';

-- Step 2: Verify the fix
SELECT 'Verification - Profiles should now have auth usernames:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    au.raw_user_meta_data->>'username' as auth_username,
    p.email,
    CASE 
        WHEN p.username = au.raw_user_meta_data->>'username' THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.raw_user_meta_data->>'username' IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 3: Show all profiles to verify
SELECT 'All profiles after fix:' as info;
SELECT 
    p.id,
    p.username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    p.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;
