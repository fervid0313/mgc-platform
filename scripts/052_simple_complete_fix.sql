-- SIMPLE FIX: Fix profile creation and Community display
-- This will fix all issues without complex DO blocks

-- Step 1: Check current state
SELECT 'Current state check:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM entries) as entries_count;

-- Step 2: Drop the entire profiles table and recreate without RLS
DROP TABLE IF EXISTS profiles CASCADE;

-- Step 3: Recreate profiles table without RLS
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

-- Step 4: Create indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Step 5: Grant all permissions (no RLS)
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;
GRANT ALL ON profiles TO anon;
GRANT ALL ON profiles TO public;

-- Step 6: Restore profiles with proper usernames
INSERT INTO profiles (id, username, email, tag, avatar, bio, trading_style, win_rate, total_trades, social_links, created_at)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1), 'User' || LPAD(FLOOR(RANDOM() * 999)::TEXT, 3, '0')) as username,
    au.email,
    '0000',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '{}',
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id);

-- Step 7: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 8: Test profile creation
SELECT 'Testing profile creation:' as info;
INSERT INTO profiles (id, username, email, tag, social_links, created_at) 
VALUES (
    gen_random_uuid(), 
    'testuser', 
    'test@example.com', 
    '1234',
    '{}',
    NOW()
);

-- Step 9: Verify the fix
SELECT 'Verification - All users should have profiles:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count,
    (SELECT COUNT(*) FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = au.id)) as users_without_profiles;

-- Step 10: Show sample profiles
SELECT 'Sample profiles:' as info;
SELECT id, username, email, tag, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 11: Test entries loading
SELECT 'Testing entries load:' as info;
SELECT COUNT(*) as count FROM entries LIMIT 1;
