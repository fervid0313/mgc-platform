-- Populate socialLinks for all profiles to fix schema cache
-- Run this in Supabase SQL Editor

-- Check current state
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links,
  COUNT(CASE WHEN socialLinks IS NULL THEN 1 END) as profiles_without_social_links
FROM public.profiles;

-- Update all profiles without socialLinks to have empty JSON object
UPDATE public.profiles 
SET socialLinks = '{}'::jsonb 
WHERE socialLinks IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links,
  COUNT(CASE WHEN socialLinks IS NULL THEN 1 END) as profiles_without_social_links
FROM public.profiles;

-- Show sample data
SELECT 
  id,
  username,
  tag,
  socialLinks,
  created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;
