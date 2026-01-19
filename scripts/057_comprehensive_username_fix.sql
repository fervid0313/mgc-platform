-- COMPREHENSIVE FIX: Handle username mismatches and profile creation issues
-- This will fix the mismatch and ensure proper username handling

-- Step 1: Check the mismatch details
SELECT 'Detailed mismatch analysis:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN au.raw_user_meta_data->>'username' IS NULL THEN '❌ No auth metadata'
        WHEN p.username = au.raw_user_meta_data->>'username' THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.username != au.raw_user_meta_data->>'username' OR au.raw_user_meta_data->>'username' IS NULL
ORDER BY p.created_at DESC;

-- Step 2: Update profiles with proper usernames
-- First, try to use auth username if available
UPDATE profiles p
SET username = au.raw_user_meta_data->>'username'
FROM auth.users au
WHERE p.id = au.id
    AND au.raw_user_meta_data->>'username' IS NOT NULL
    AND p.username != au.raw_user_meta_data->>'username';

-- Step 3: For profiles without auth metadata, create better usernames
UPDATE profiles p
SET username = CASE
    WHEN p.username = p.email OR p.username LIKE '%@%' THEN 'Trader' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')
    WHEN p.username IS NULL OR p.username = '' THEN 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')
    ELSE p.username
END
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users au 
    WHERE au.id = p.id 
    AND au.raw_user_meta_data->>'username' IS NOT NULL
);

-- Step 4: For profiles with no auth user at all, create usernames
UPDATE profiles p
SET username = CASE
    WHEN p.username = p.email OR p.username LIKE '%@%' THEN 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')
    WHEN p.username IS NULL OR p.username = '' THEN 'Member' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')
    ELSE p.username
END
WHERE NOT EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id)
    AND (p.username = p.email OR p.username LIKE '%@%' OR p.username IS NULL OR p.username = '');

-- Step 5: Verify the fix
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

-- Step 6: Show final count
SELECT 'Final count:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE au.raw_user_meta_data->>'username' IS NOT NULL) as has_auth_metadata,
    (SELECT COUNT(*) FROM profiles p JOIN auth.users au ON p.id = au.id WHERE au.raw_user_meta_data->>'username' IS NULL) as no_auth_metadata,
    (SELECT COUNT(*) FROM profiles WHERE username LIKE '%@%') as still_using_email;

-- Step 7: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 8: Test profile creation to ensure it works
SELECT 'Testing profile creation:' as info;
INSERT INTO profiles (id, username, email, tag, created_at) 
VALUES (
    gen_random_uuid(), 
    'testuser', 
    'test@example.com', 
    '1234',
    NOW()
);
