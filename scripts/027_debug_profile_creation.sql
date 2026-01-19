-- SIMPLE TEST: Direct profile creation test
-- This will help us identify what's blocking profile creation

-- Step 1: Check current auth users
SELECT 'Current auth users:' as info;
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 3;

-- Step 2: Check current profiles
SELECT 'Current profiles:' as info;
SELECT id, username, email, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- Step 3: Try to create a test profile manually
SELECT 'Creating test profile:' as info;
INSERT INTO profiles (id, username, email, tag, socialLinks, created_at) 
VALUES (
    '00000000-0000-0000-0000-000000000999', 
    'testuser', 
    'test@example.com', 
    '9999',
    '{}',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 4: Verify test profile was created
SELECT 'Test profile verification:' as info;
SELECT * FROM profiles WHERE id = '00000000-0000-0000-0000-000000000999';

-- Step 5: Clean up test profile
DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000999';

-- Step 6: Check if RLS is blocking
SELECT 'RLS Status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 7: Check policies
SELECT 'Policies:' as info;
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 8: Check permissions
SELECT 'Permissions:' as info;
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- This will tell us exactly what's blocking profile creation
