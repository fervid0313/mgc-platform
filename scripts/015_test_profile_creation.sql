-- Test script to verify profile creation works
-- Run this after the RLS fix script

-- Step 1: Check if RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 2: Try to create a test profile (this should work now)
INSERT INTO profiles (id, username, email, tag, social_links) 
VALUES (
    '00000000-0000-0000-0000-000000000999', 
    'testuser', 
    'test@example.com', 
    '9999', 
    '{}'
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify the test profile was created
SELECT id, username, email, tag 
FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000999';

-- Step 4: Clean up the test profile
DELETE FROM profiles 
WHERE id = '00000000-0000-0000-0000-000000000999';

-- Step 5: Check total profiles count
SELECT COUNT(*) as total_profiles FROM profiles;

-- If this script runs without errors, profile creation should work for new users
