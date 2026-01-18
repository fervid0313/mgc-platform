-- Force refresh Supabase schema cache
-- Run this in Supabase SQL Editor

-- Method 1: Drop and recreate the column (will lose data temporarily)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS socialLinks;

-- Wait a moment for the cache to clear
SELECT pg_sleep(1);

-- Recreate the column
ALTER TABLE public.profiles 
ADD COLUMN socialLinks JSONB DEFAULT '{}'::jsonb;

-- Method 2: Update all rows to trigger cache refresh
UPDATE public.profiles 
SET socialLinks = '{}'::jsonb 
WHERE socialLinks IS NOT NULL;

-- Method 3: Check if the column is now recognized
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'socialLinks'
ORDER BY ordinal_position;

-- Method 4: Test the column with a simple query
SELECT COUNT(*) as test_count, socialLinks 
FROM public.profiles 
LIMIT 1;
