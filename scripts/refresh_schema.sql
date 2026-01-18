-- Refresh schema and verify everything is working
-- Run this in Supabase SQL Editor

-- Check current profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verify socialLinks column exists
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links
FROM public.profiles;

-- Update all profiles to have socialLinks if they don't
UPDATE public.profiles 
SET socialLinks = '{}'::jsonb 
WHERE socialLinks IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links
FROM public.profiles;

-- Show sample profile data
SELECT 
  id,
  username,
  tag,
  socialLinks,
  created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 3;
