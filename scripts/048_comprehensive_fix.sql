-- COMPREHENSIVE FIX: Handle profiles without auth metadata
-- This will fix the remaining profile that doesn't have auth username

-- Step 1: Find the profile that's still using fallback
SELECT 'Profile still using fallback username:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN au.raw_user_meta_data->>'username' IS NOT NULL THEN '✅ Has auth metadata'
        ELSE '❌ No auth metadata'
    END as auth_status,
    CASE 
        WHEN p.username = p.email OR p.username LIKE '%@%' THEN '❌ Using email'
        ELSE '✅ Using proper username'
    END as username_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE p.username = p.email OR p.username LIKE '%@%'
ORDER BY p.created_at DESC;

-- Step 2: Create a better username for profiles without auth metadata
UPDATE profiles p
SET username = CASE
    WHEN au.raw_user_meta_data->>'username' IS NOT NULL THEN au.raw_user_meta_data->>'username'
    WHEN p.username = p.email OR p.username LIKE '%@%' THEN 'Trader' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')
    ELSE p.username
END
FROM auth.users au
WHERE p.id = au.id
    AND (p.username = p.email OR p.username LIKE '%@%');

-- Step 3: For profiles with no auth user at all, create usernames
UPDATE profiles p
SET username = CASE
    WHEN p.username = p.email OR p.username LIKE '%@%' THEN 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')
    ELSE p.username
END
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id)
    AND (p.username = p.email OR p.username LIKE '%@%');

-- Step 4: Verify the fix
SELECT 'Verification - All profiles should have proper usernames:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN au.raw_user_meta_data->>'username' IS NOT NULL THEN '✅ Has auth metadata'
        ELSE '❌ No auth metadata'
    END as auth_status,
    CASE 
        WHEN p.username LIKE '%@%' THEN '❌ Still using email'
        ELSE '✅ Using proper username'
    END as username_status
FROM profiles p
LEFT JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 5: Show final count
SELECT 'Final count:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE au.raw_user_meta_data->>'username' IS NOT NULL) as has_auth_metadata,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE au.raw_user_meta_data->>'username' IS NULL) as no_auth_metadata,
    (SELECT COUNT(*) FROM profiles WHERE username LIKE '%@%') as still_using_email;

-- Step 6: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';
