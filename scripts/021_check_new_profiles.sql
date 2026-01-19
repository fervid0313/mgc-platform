-- Quick test to verify new profiles are being created
-- Run this to check if the latest signup created a profile

-- Check the most recent profiles
SELECT id, username, email, tag, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check total profiles count
SELECT COUNT(*) as total_profiles FROM profiles;

-- If you just created a new user, you should see them at the top of this list
-- The timestamp should be very recent (within the last few minutes)

-- Also check if there are any auth users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    p.username as profile_username,
    p.created_at as profile_created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- If this returns no rows, then all auth users have profiles
-- If it returns rows, those users are missing profiles and need manual fixes
