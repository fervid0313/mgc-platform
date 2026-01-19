-- FIX: Create profiles for the 2 missing users
-- This will find the users without profiles and create them

-- Step 1: Find exactly which users are missing profiles
SELECT 'Users missing profiles:' as info;
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Create profiles for missing users
INSERT INTO profiles (id, username, email, tag, socialLinks, created_at)
SELECT 
    au.id,
    split_part(au.email, '@', 1) as username,
    au.email,
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as tag,
    '{}',
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify all users now have profiles
SELECT 'Verification - All users should have profiles:' as info;
SELECT 
    au.id,
    au.email,
    CASE WHEN p.id IS NOT NULL THEN '✅ Has Profile' ELSE '❌ Missing Profile' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Step 4: Show final counts
SELECT 'Final counts:' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles;

-- Step 5: Show all profiles
SELECT 'All profiles:' as info;
SELECT id, username, email, tag, created_at 
FROM profiles 
ORDER BY created_at DESC;
