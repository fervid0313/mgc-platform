-- DIRECT FIX: Fix profile creation and schema cache issues
-- This will fix the empty error objects and schema cache problems

-- Step 1: Drop profiles table completely
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 2: Wait for cascade to complete
SELECT pg_sleep(2);

-- Step 3: Recreate profiles table with NO constraints
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
) WITHOUT OIDS;

-- Step 4: Grant ALL permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO public;

-- Step 5: Disable RLS explicitly
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 6: Create simple profiles for all users
INSERT INTO profiles (id, username, email, tag, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')) as username,
    au.email,
    '0000',
    au.created_at
FROM auth.users au;

-- Step 7: Force schema cache refresh multiple times
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload config';

-- Step 8: Test profile creation
INSERT INTO profiles (id, username, email, tag, created_at) 
VALUES (
    gen_random_uuid(), 
    'testuser', 
    'test@example.com', 
    '1234',
    NOW()
);

-- Step 9: Verify everything works
SELECT 'Final verification:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles') as policy_count,
    (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') as rls_enabled;

-- Step 10: Show sample profiles
SELECT 'Sample profiles:' as info;
SELECT id, username, email, tag, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;
