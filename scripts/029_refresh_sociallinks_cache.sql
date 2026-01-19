-- QUICK FIX: Refresh socialLinks schema cache again
-- The PGRST204 error is back, meaning the schema cache needs refreshing

-- Step 1: Check if socialLinks column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'socialLinks';

-- Step 2: Force multiple schema cache refreshes
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Step 3: Test profile creation with socialLinks
SELECT 'Testing profile creation with socialLinks:' as info;
DO $$
BEGIN
    INSERT INTO profiles (id, username, email, tag, socialLinks) 
    VALUES (
        '00000000-0000-0000-0000-000000000997', 
        'testuser', 
        'test@example.com', 
        '7777',
        '{}'
    ) ON CONFLICT (id) DO NOTHING;
    
    IF EXISTS (SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000997') THEN
        RAISE NOTICE '✅ Profile creation with socialLinks PASSED';
        DELETE FROM profiles WHERE id = '00000000-0000-0000-0000-000000000997';
    ELSE
        RAISE NOTICE '❌ Profile creation with socialLinks FAILED';
    END IF;
END $$;

-- Step 4: If socialLinks doesn't exist, add it
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

-- Step 5: Refresh schema cache again
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(2);
NOTIFY pgrst, 'reload schema';
