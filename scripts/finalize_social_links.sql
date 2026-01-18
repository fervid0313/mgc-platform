-- Final script to ensure ALL profiles have socialLinks
-- Run this in Supabase SQL Editor

-- Check current state
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links,
  COUNT(CASE WHEN socialLinks IS NULL THEN 1 END) as profiles_without_social_links
FROM public.profiles;

-- Force update ALL profiles to ensure they have socialLinks
UPDATE public.profiles 
SET socialLinks = COALESCE(socialLinks, '{}'::jsonb);

-- Verify the update
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links,
  COUNT(CASE WHEN socialLinks IS NULL THEN 1 END) as profiles_without_social_links
FROM public.profiles;

-- Show all profiles with their socialLinks status
SELECT 
  id,
  username,
  tag,
  socialLinks,
  CASE 
    WHEN socialLinks IS NOT NULL THEN 'HAS socialLinks'
    ELSE 'MISSING socialLinks'
  END as status
FROM public.profiles 
ORDER BY created_at DESC;
