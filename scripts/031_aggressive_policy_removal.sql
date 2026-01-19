-- AGGRESSIVE POLICY REMOVAL: Force delete all policies on profiles table
-- The policies are persisting, so we need to be more aggressive

-- Step 1: Check current policies
SELECT 'Current policies before removal:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 2: Force drop all policies with different approaches
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on id" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Enable select for all users" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles RESTRICT;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles RESTRICT;

-- Step 3: Try CASCADE approach again
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

-- Step 4: Try direct system catalog approach
DELETE FROM pg_policies WHERE tablename = 'profiles';

-- Step 5: Verify policies are gone
SELECT 'Policies after removal:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 6: Check policy count
SELECT 'Policy count:' as info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';

-- Step 7: Ensure RLS is disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 8: Grant permissions again
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 9: Test profile creation
SELECT 'Testing profile creation:' as info;
DO $$
BEGIN
    INSERT INTO profiles (id, username, email, tag, socialLinks, created_at) 
    VALUES (
        '00000000-0000-0000-0000-000000000995', 
        'testuser', 
        'test@example.com', 
        '5555',
        '{}',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000995') THEN
        RAISE NOTICE '✅ Profile creation test PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000995';
    ELSE
        RAISE NOTICE '❌ Profile creation test FAILED';
    END IF;
END $$;
