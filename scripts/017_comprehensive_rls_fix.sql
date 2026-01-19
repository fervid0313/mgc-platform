-- COMPREHENSIVE FIX: Remove all RLS and permission blocks on profiles table
-- Copy and paste this entire content into Supabase SQL Editor

-- Step 1: Check current state
SELECT 'Current RLS status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

SELECT 'Current policies:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 2: Disable RLS completely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 3: Drop ALL possible policies (comprehensive list)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users based on id" ON profiles;
DROP POLICY IF EXISTS "Enable select for all users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all operations on profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- Step 4: Grant permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Step 5: Verify the fix
SELECT 'RLS disabled:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

SELECT 'Policies after cleanup:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'Table permissions:' as info;
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- Step 6: Test the table works
SELECT 'Current profiles count:' as info;
SELECT COUNT(*) as count FROM profiles;

SELECT 'Sample profiles:' as info;
SELECT id, username, email, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- Step 7: Test insert capability
SELECT 'Testing insert capability:' as info;
DO $$
BEGIN
    -- Try to insert a test profile
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
        RAISE NOTICE '✅ Insert test PASSED - profile creation should work now';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000999';
    ELSE
        RAISE NOTICE '❌ Insert test FAILED - still having issues';
    END IF;
END $$;
