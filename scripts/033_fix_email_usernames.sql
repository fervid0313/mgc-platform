-- FIX: Update profiles that have email as username instead of proper username
-- This will fix existing profiles that show email in Community instead of username

-- Step 1: Find profiles that have email as username (likely old profiles)
SELECT 'Profiles with email as username (need fixing):' as info;
SELECT 
    id,
    username,
    email,
    created_at,
    CASE 
        WHEN username = email THEN '❌ Email used as username'
        WHEN username = split_part(email, '@', 1) THEN '❌ Email prefix used as username'
        ELSE '✅ Proper username'
    END as status
FROM profiles
ORDER BY created_at DESC;

-- Step 2: Fix profiles that have email as username
UPDATE profiles 
SET username = 'User' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
WHERE username = email OR username = split_part(email, '@', 1);

-- Step 3: Verify the fix
SELECT 'Profiles after fix:' as info;
SELECT 
    id,
    username,
    email,
    created_at,
    CASE 
        WHEN username = email THEN '❌ Still has email as username'
        WHEN username = split_part(email, '@', 1) THEN '❌ Still has email prefix as username'
        ELSE '✅ Fixed username'
    END as status
FROM profiles
ORDER BY created_at DESC;

-- Step 4: Show sample of fixed profiles
SELECT 'Sample fixed profiles:' as info;
SELECT id, username, email, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
