-- BETTER FIX: Extract actual usernames from Supabase Auth metadata
-- This will get the usernames that users entered during signup from auth.user.raw_user_meta_data

-- Step 1: Check what's in auth metadata
SELECT 'Auth metadata sample:' as info;
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data,
    au.created_at
FROM auth.users au
ORDER BY au.created_at DESC
LIMIT 5;

-- Step 2: Find profiles that have email as username and fix them with auth metadata
UPDATE profiles p
SET username = COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1),
    p.username
)
FROM auth.users au
WHERE p.id = au.id 
    AND (p.username = au.email OR p.username = split_part(au.email, '@', 1))
RETURNING p.*;

-- Step 3: Show the fixed profiles
SELECT 'Fixed profiles with auth metadata:' as info;
SELECT 
    p.id,
    p.username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    p.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.username != au.email 
    AND p.username != split_part(au.email, '@', 1)
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 4: Check remaining profiles that still have email as username
SELECT 'Remaining profiles with email as username:' as info;
SELECT 
    p.id,
    p.username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    p.created_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.username = au.email 
    OR p.username = split_part(au.email, '@', 1)
ORDER BY p.created_at DESC;

-- Step 5: For remaining profiles, try to create better usernames from email
UPDATE profiles p
SET username = CASE
    WHEN p.username = au.email THEN 
        CASE 
            WHEN au.raw_user_meta_data->>'username' IS NOT NULL THEN au.raw_user_meta_data->>'username'
            ELSE 'Trader' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')
        END
    WHEN p.username = split_part(au.email, '@', 1) THEN
        CASE 
            WHEN au.raw_user_meta_data->>'username' IS NOT NULL THEN au.raw_user_meta_data->>'username'
            ELSE 'Trader' || LPAD(FLOOR(RANDOM() * 1000)::TEXT, 3, '0')
        END
    ELSE p.username
END
FROM auth.users au
WHERE p.id = au.id 
    AND (p.username = au.email OR p.username = split_part(au.email, '@', 1));

-- Step 6: Final verification
SELECT 'Final verification - all profiles should have proper usernames:' as info;
SELECT 
    p.id,
    p.username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN p.username = au.email THEN '❌ Still has email as username'
        WHEN p.username = split_part(au.email, '@', 1) THEN '❌ Still has email prefix as username'
        ELSE '✅ Proper username'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC;
