-- SIMPLE FIX: Just refresh the PostgREST schema cache
-- The socialLinks column already exists, we just need to refresh the cache

-- Step 1: Verify socialLinks column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'socialLinks';

-- Step 2: Refresh PostgREST schema cache (this is the key fix)
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 3: Wait a moment and refresh again
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Step 4: Test profile creation without socialLinks first
SELECT 'Testing basic profile creation:' as info;
DO $$
BEGIN
    -- Try to insert a test profile without socialLinks
    INSERT INTO profiles (id, username, email, tag) 
    VALUES (
        '00000000-0000-0000-0000-000000000998', 
        'testuser2', 
        'test2@example.com', 
        '8888'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Check if it worked
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000998') THEN
        RAISE NOTICE '✅ Basic profile insert PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000998';
    ELSE
        RAISE NOTICE '❌ Basic profile insert FAILED';
    END IF;
END $$;

-- Step 5: Test profile creation with socialLinks
SELECT 'Testing profile creation with socialLinks:' as info;
DO $$
BEGIN
    -- Try to insert a test profile with socialLinks
    INSERT INTO profiles (id, username, email, tag, socialLinks) 
    VALUES (
        '00000000-0000-0000-0000-000000000997', 
        'testuser3', 
        'test3@example.com', 
        '7777',
        '{}'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Check if it worked
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000997') THEN
        RAISE NOTICE '✅ Profile with socialLinks insert PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000997';
    ELSE
        RAISE NOTICE '❌ Profile with socialLinks insert FAILED';
    END IF;
END $$;

-- Step 6: Show current profiles
SELECT 'Current profiles count:' as info;
SELECT COUNT(*) as count FROM profiles;

-- Step 7: Show table structure
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- The schema cache should now be refreshed and profile creation should work
