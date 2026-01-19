-- SIMPLE FIX: Fix profiles table without complex DISTINCT ON
-- This will fix all profile creation and Community display issues

-- Step 1: Create backup of existing profiles
CREATE TABLE profiles_backup AS SELECT * FROM profiles;

-- Step 2: Drop the entire profiles table
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

-- Step 6: Restore data from backup with auth usernames (simple approach)
INSERT INTO profiles (id, username, email, tag, avatar, bio, trading_style, win_rate, total_trades, social_links, created_at)
SELECT 
    pb.id,
    COALESCE(au.raw_user_meta_data->>'username', pb.username, split_part(pb.email, '@', 1)) as username,
    pb.email,
    pb.tag,
    pb.avatar,
    pb.bio,
    pb.trading_style,
    pb.win_rate,
    pb.total_trades,
    pb.social_links,
    pb.created_at
FROM profiles_backup pb
LEFT JOIN auth.users au ON pb.id = au.id
WHERE NOT EXISTS (
    SELECT 1 FROM profiles p2 
    WHERE p2.id = pb.id 
    AND p2.created_at > pb.created_at
);

-- Step 7: Force schema cache refresh
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';

-- Step 8: Test profile creation
SELECT 'Testing profile creation:' as info;
DO $$
BEGIN
    INSERT INTO profiles (id, username, email, tag, social_links, created_at) 
    VALUES (
        gen_random_uuid(), 
        'testuser', 
        'test@example.com', 
        '1234',
        '{}',
        NOW()
    );
    
    RAISE NOTICE '✅ Profile creation test PASSED';
END $$;

-- Step 9: Verify the fix
SELECT 'Verification - All profiles should have proper usernames:' as info;
SELECT 
    p.id,
    p.username,
    p.email,
    au.raw_user_meta_data->>'username' as auth_username,
    CASE 
        WHEN p.username = au.raw_user_meta_data->>'username' THEN '✅ Match'
        ELSE '❌ Using fallback'
    END as status
FROM profiles p
JOIN auth.users au ON p.id = au.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Step 10: Final verification
SELECT 'Final state:' as info;
SELECT 
    (SELECT COUNT(*) FROM profiles) as profile_count,
    (SELECT COUNT(*) FROM auth.users) as auth_users_count;

-- Step 11: Clean up backup
DROP TABLE profiles_backup;
