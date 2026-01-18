-- Force add socialLinks column to profiles table
-- Run this in Supabase SQL Editor

-- First, let's see what columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Force add the column (ignore if exists error)
ALTER TABLE public.profiles 
ADD COLUMN socialLinks JSONB DEFAULT '{}'::jsonb;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
  AND column_name = 'socialLinks'
ORDER BY ordinal_position;

-- Show the table structure
\d public.profiles
