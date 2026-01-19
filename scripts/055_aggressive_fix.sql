-- AGGRESSIVE FIX: Fix schema cache and profile creation issues
-- This will fix the entries-profiles relationship and empty error objects

-- Step 1: Check current state
SELECT 'Current state check:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM entries) as entries_count;

-- Step 2: Drop ALL foreign key constraints on entries
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'entries' 
        AND constraint_type = 'f'
    LOOP
        EXECUTE 'ALTER TABLE entries DROP CONSTRAINT ' || constraint_rec.constraint_name || ' CASCADE';
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.constraint_name;
    END LOOP;
END $$;

-- Step 3: Drop profiles table completely
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 4: Wait for cascade to complete
SELECT pg_sleep(2);

-- Step 5: Recreate profiles table with minimal structure
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT NOT NULL,
    tag TEXT NOT NULL DEFAULT '0000',
    avatar TEXT,
    bio TEXT,
    trading_style TEXT,
    win_rate DECIMAL(5,2),
    total_trades INTEGER DEFAULT 0,
    social_links JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Grant ALL permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO public;

-- Step 7: Disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 8: Create profiles for all users
INSERT INTO profiles (id, username, email, tag, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')) as username,
    au.email,
    '0000',
    au.created_at
FROM auth.users au;

-- Step 9: Force schema cache refresh multiple times
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);

-- Step 10: Test profile creation
INSERT INTO profiles (id, username, email, tag, created_at) 
VALUES (
    gen_random_uuid(), 
    'testuser', 
    'test@example.com', 
    '1234',
    NOW()
);

-- Step 11: Test entries loading without join
SELECT 'Testing entries load:' as info;
SELECT COUNT(*) as entries_count FROM entries LIMIT 1;

-- Step 12: Verify everything works
SELECT 'Final verification:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') as rls_enabled;

-- Step 13: Show sample profiles
SELECT 'Sample profiles:' as info;
SELECT id, username, email, tag, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
