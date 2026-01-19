-- TARGETED POLICY REMOVAL: Remove the exact policies that exist
-- These are the actual policy names that need to be removed

-- Step 1: Remove the exact policies that exist
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles CASCADE;

-- Step 2: Verify they're gone
SELECT 'Policies after removal:' as info;
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';

-- Step 3: Check policy count
SELECT 'Policy count:' as info;
SELECT COUNT(*) as policy_count FROM pg_policies WHERE tablename = 'profiles';

-- Step 4: Ensure RLS is disabled
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 5: Grant full permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 6: Test profile creation
SELECT 'Testing profile creation:' as info;
DO $$
BEGIN
    INSERT INTO profiles (id, username, email, tag, socialLinks, created_at) 
    VALUES (
        '00000000-0000-0000-0000-000000000994', 
        'testuser', 
        'test@example.com', 
        '4444',
        '{}',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000994') THEN
        RAISE NOTICE '✅ Profile creation test PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000994';
    ELSE
        RAISE NOTICE '❌ Profile creation test FAILED';
    END IF;
END $$;

-- Step 7: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 8: Show final status
SELECT 'Final status:' as info;
SELECT 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') as rls_enabled;
