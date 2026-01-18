-- Add missing socialLinks column to profiles table
-- Run this in Supabase SQL Editor

-- Check current profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Add socialLinks column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS socialLinks JSONB DEFAULT '{}'::jsonb;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'socialLinks'
ORDER BY ordinal_position;
