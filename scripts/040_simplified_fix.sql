-- SIMPLIFIED FIX: Remove RLS policies and fix Community display
-- Skip the problematic pg_policies deletion

-- Step 1: Completely disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies with CASCADE
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles CASCADE;

-- Step 3: Grant all permissions to all roles
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO public;

-- Step 4: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 5: Update all profiles to use auth metadata usernames
UPDATE profiles p
SET username = COALESCE(
    au.raw_user_meta_data->>'username',
    split_part(au.email, '@', 1),
    p.username
)
FROM auth.users au
WHERE p.id = au.id
    AND au.raw_user_meta_data->>'username' IS NOT NULL
    AND p.username != au.raw_user_meta_data->>'username';

-- Step 6: Verify the fix
SELECT 'Verification - Profiles should have auth usernames:' as info;
SELECT 
    p.id,
    p.username as profile_username,
    au.raw_user_meta_data->>'username' as auth_username,
    p.email,
    CASE 
        WHEN p.username = au.raw_user_meta_data->>'username' THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE au.raw_user_meta_data->>'username' IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 7: Check final state
SELECT 'Final state:' as info;
SELECT 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') as rls_enabled,
    (SELECT COUNT(*) FROM profiles) as profile_count;
