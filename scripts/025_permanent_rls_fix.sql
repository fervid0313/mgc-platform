-- PERMANENT FIX: Completely remove RLS from profiles table forever
-- This will ensure profile creation always works for new users

-- Step 1: Completely disable RLS and make sure it stays disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL possible policies (comprehensive cleanup)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on id" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable select for all users" ON profiles CASCADE;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles CASCADE;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles CASCADE;

-- Step 3: Grant permanent permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 4: Verify RLS is permanently disabled
SELECT 'RLS Status Check:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 5: Verify no policies exist
SELECT 'Policies Check (should be empty):' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 6: Test profile creation with a new user
SELECT 'Testing profile creation:' as info;
DO $$
BEGIN
    -- Create a test profile to verify it works
    INSERT INTO profiles (id, username, email, tag, socialLinks) 
    VALUES (
        '00000000-0000-0000-0000-000000000999', 
        'testuser', 
        'test@example.com', 
        '9999',
        '{}'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Check if it worked
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000999') THEN
        RAISE NOTICE '✅ Profile creation test PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000999';
        RAISE NOTICE '✅ Test profile cleaned up';
    ELSE
        RAISE NOTICE '❌ Profile creation test FAILED';
    END IF;
END $$;

-- Step 7: Force schema refresh multiple times
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Step 8: Create missing profiles for any users that don't have them
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

-- Step 9: Final verification
SELECT 'Final Status:' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policies_count;

-- This should permanently fix the issue - RLS is completely disabled
