-- Check if profiles table exists and has the right structure
-- Run this in Supabase SQL Editor

-- Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
) as profiles_table_exists;

-- Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if social_connections table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'social_connections'
) as social_connections_table_exists;

-- Check social_connections table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'social_connections'
ORDER BY ordinal_position;

-- Check if there are any profiles
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Check if there are any social connections
SELECT COUNT(*) as connection_count FROM public.social_connections;
