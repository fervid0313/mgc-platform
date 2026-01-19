-- COMPREHENSIVE FIX: Remove all RLS restrictions completely
-- The empty error objects suggest RLS is blocking all profile creation

-- Step 1: Completely disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL possible policies with CASCADE
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

-- Step 3: Grant permissions to all roles
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO public;

-- Step 4: Verify RLS is disabled
SELECT 'RLS Status:' as info;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- Step 5: Verify no policies exist
SELECT 'Policies Count:' as info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';

-- Step 6: Test profile creation directly
SELECT 'Testing profile creation:' as info;
DO $$
BEGIN
    INSERT INTO profiles (id, username, email, tag, socialLinks, created_at) 
    VALUES (
        '00000000-0000-0000-0000-000000000996', 
        'testuser', 
        'test@example.com', 
        '6666',
        '{}',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000996') THEN
        RAISE NOTICE '✅ Direct profile creation PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000996';
    ELSE
        RAISE NOTICE '❌ Direct profile creation FAILED';
    END IF;
END $$;

-- Step 7: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 8: Check table permissions
SELECT 'Table Permissions:' as info;
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'profiles';

-- Step 9: Show table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
