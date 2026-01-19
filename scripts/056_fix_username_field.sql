-- TARGETED FIX: Fix username field to use custom username instead of email
-- This will update profiles to use the actual username from auth metadata

-- Step 1: Find profiles with email as username
SELECT 'Profiles with email as username:' as info;
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
ORDER BY p.created_at DESC;

-- Step 2: Update profiles to use auth username
UPDATE profiles p
SET username = COALESCE(au.raw_user_meta_data->>'username', 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0'))
FROM auth.users au
WHERE p.id = au.id
    AND (p.username = p.email OR p.username LIKE '%@%');

-- Step 3: Verify the fix
SELECT 'Verification - All profiles should have proper usernames:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN p.username = au.raw_user_meta_data->>'username' THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 4: Show final count
SELECT 'Final count:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE p.username = au.raw_user_meta_data->>'username') as auth_username_count,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE p.username != au.raw_user_meta_data->>'username') as mismatch_count,
    (SELECT COUNT(*) FROM profiles WHERE username LIKE '%@%') as still_using_email;

-- Step 5: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';
