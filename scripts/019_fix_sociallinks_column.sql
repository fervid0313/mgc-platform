-- FIX: Add missing socialLinks column and refresh schema cache
-- The error shows socialLinks column is missing from schema cache

-- Step 1: Check if socialLinks column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'socialLinks';

-- Step 2: Add socialLinks column if it doesn't exist
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
    RAISE NOTICE '✅ socialLinks column added';
  ELSE
    RAISE NOTICE '✅ socialLinks column already exists';
  END IF;
END $$;

-- Step 3: Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Step 4: Check all columns in profiles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Step 5: Test profile creation without socialLinks first
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

-- Step 6: Test profile creation with socialLinks
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

-- Step 7: Force schema refresh again
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Step 8: Show final table structure
SELECT 'Final profiles table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;
