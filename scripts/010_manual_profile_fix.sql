-- Manual fix for missing profiles
-- Run this in Supabase SQL Editor to find and fix missing profiles

-- Step 1: Check how many profiles we currently have
SELECT COUNT(*) as total_profiles FROM profiles;

-- Step 2: See all current profiles with their emails
SELECT 
    id,
    username,
    email,
    created_at,
    ROW_NUMBER() OVER (ORDER BY created_at) as profile_number
FROM profiles 
ORDER BY created_at DESC;

-- Step 3: If you know specific emails that are missing, add them manually
-- Example (replace with actual user data from your Auth dashboard):
-- INSERT INTO profiles (id, username, email, tag, social_links) 
-- VALUES (
--     'user-uuid-here', 
--     'desired-username', 
--     'user@example.com', 
--     '1234', 
--     '{}'
-- ) ON CONFLICT (id) DO NOTHING;

-- Step 4: After adding missing profiles, verify the count again
SELECT COUNT(*) as total_profiles_after_fix FROM profiles;

-- Step 5: Check for any profiles with missing usernames
SELECT id, email, username FROM profiles WHERE username IS NULL OR username = '';

-- Step 6: Fix any profiles with missing usernames
-- UPDATE profiles 
-- SET username = COALESCE(username, split_part(email, '@', 1), 'Unknown')
-- WHERE username IS NULL OR username = '';
