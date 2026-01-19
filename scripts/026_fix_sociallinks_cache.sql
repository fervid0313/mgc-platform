-- TARGETED FIX: Resolve socialLinks schema cache issue
-- The schema cache still expects socialLinks column even though we removed it from code

-- Step 1: Check if socialLinks column actually exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'socialLinks';

-- Step 2: If it doesn't exist, add it back to satisfy the schema cache
DO $$ 
BEGIN
  -- Add socialLinks column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'socialLinks'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN socialLinks JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✅ socialLinks column added back';
  ELSE
    RAISE NOTICE '✅ socialLinks column already exists';
  END IF;
END $$;

-- Step 3: Force multiple schema cache refreshes
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Step 4: Test profile creation with socialLinks included
SELECT 'Testing profile creation with socialLinks:' as info;
DO $$
BEGIN
    -- Try to insert a test profile with socialLinks
    INSERT INTO profiles (id, username, email, tag, socialLinks) 
    VALUES (
        '00000000-0000-0000-0000-000000000998', 
        'testuser', 
        'test@example.com', 
        '8888',
        '{}'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Check if it worked
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000998') THEN
        RAISE NOTICE '✅ Profile creation with socialLinks PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000998';
    ELSE
        RAISE NOTICE '❌ Profile creation with socialLinks FAILED';
    END IF;
END $$;

-- Step 5: Update the code to include socialLinks again
-- We need to add socialLinks back to the code since the schema expects it

-- Step 6: Create missing profiles for any users that don't have them
INSERT INTO profiles (id, username, email, tag, socialLinks, created_at)
SELECT 
    au.id,
    split_part(au.email, '@', 1) as username,
    au.email,
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') as tag,
    '{}',
    au.created_at
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 7: Final verification
SELECT 'Final verification:' as info;
SELECT 
    (SELECT COUNT(*) FROM auth.users) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles;

-- Step 8: Show table structure
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
