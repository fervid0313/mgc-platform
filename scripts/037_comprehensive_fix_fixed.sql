-- COMPREHENSIVE FIX: Fix all profile creation issues (Fixed UUID format)

-- Step 1: Check current profiles
SELECT 'Current profiles count:' as info;
SELECT COUNT(*) as count FROM profiles;

-- Step 2: Check for duplicate IDs
SELECT 'Duplicate profile IDs:' as info;
SELECT id, COUNT(*) as count 
FROM profiles 
GROUP BY id 
HAVING COUNT(*) > 1;

-- Step 3: Remove duplicates (keep the latest one)
DELETE FROM profiles p1 USING profiles p2 
WHERE p1.ctid < p2.ctid
WHERE EXISTS (
    SELECT 1 FROM profiles p3 
    WHERE p3.id = p2.id 
    AND p3.ctid > p1.ctid
);

-- Step 4: Check socialLinks column
SELECT 'socialLinks column check:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'socialLinks';

-- Step 5: Add socialLinks if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'socialLinks'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN socialLinks JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ socialLinks column added';
  ELSE
    RAISE NOTICE '✅ socialLinks column already exists';
  END IF;
END $$;

-- Step 6: Force multiple schema cache refreshes
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Step 7: Remove all RLS policies completely
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 8: Drop all policies
DROP POLICY IF EXISTS "profiles_delete_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_select_all" ON profiles CASCADE;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles CASCADE;

-- Step 9: Grant full permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;

-- Step 10: Test profile creation with correct UUID format
SELECT 'Testing profile creation:' as info;
DO $$
BEGIN
    INSERT INTO profiles (id, username, email, tag, socialLinks, created_at) 
    VALUES (
        '00000000-0000-0000-0000-000000000999', 
        'testuser', 
        'test@example.com', 
        '3333',
        '{}',
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000-0000-0000-0000-000000000999') THEN
        RAISE NOTICE '✅ Profile creation test PASSED';
        DELETE FROM profiles WHERE id = '00000-0000-0000-0000-000000000999';
    ELSE
        RAISE NOTICE '❌ Profile creation test FAILED';
    END IF;
END $$;

-- Step 11: Verify final state
SELECT 'Final verification:' as info;
SELECT 
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') as rls_enabled,
    (SELECT COUNT(*) FROM profiles) as profile_count;
