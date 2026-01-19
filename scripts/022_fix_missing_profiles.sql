-- Find and fix missing profiles for the 4 accounts not showing in Community
-- This will identify which auth users don't have profiles and create them

-- Step 1: Find auth users without profiles
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created_at,
    au.last_sign_in_at,
    au.email_confirmed_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ORDER BY au.created_at DESC;

-- Step 2: Create profiles for missing users
-- Run this for each user ID from the query above
-- Replace the UUIDs with the actual IDs from the query

-- Example (replace with actual UUIDs from the query above):
INSERT INTO profiles (id, username, email, tag, socialLinks) 
VALUES (
    'USER_UUID_HERE',  -- Replace with actual user ID
    'username',        -- Replace with username (can use email prefix)
    'email@example.com', -- Replace with actual email
    '1234',            -- Random 4-digit tag
    '{}'
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify all profiles now exist
SELECT 
    au.id,
    au.email,
    CASE WHEN p.id IS NOT NULL THEN '✅ Has Profile' ELSE '❌ Missing Profile' END as status
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Step 4: Check final profile count
SELECT COUNT(*) as total_profiles FROM profiles;

-- Step 5: Show all profiles with creation dates
SELECT 
    username,
    email,
    tag,
    created_at
FROM profiles 
ORDER BY created_at DESC;

-- After running this, you should have 22 profiles matching your 22 registered accounts
