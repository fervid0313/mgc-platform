-- Verify that the fixes are working
-- Run this in Supabase SQL Editor

-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if socialLinks column exists and has data
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN socialLinks IS NOT NULL THEN 1 END) as profiles_with_social_links
FROM public.profiles;

-- Show sample profile data with socialLinks
SELECT 
  id,
  username,
  tag,
  socialLinks,
  created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 3;

-- Check social_connections table
SELECT 
  COUNT(*) as total_connections,
  COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_connections
FROM public.social_connections;

-- Show sample connection data
SELECT 
  id,
  requester_id,
  requested_id,
  status,
  created_at
FROM public.social_connections 
ORDER BY created_at DESC 
LIMIT 3;
