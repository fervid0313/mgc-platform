-- Comprehensive fix for profiles table schema issues
-- Run this in Supabase SQL Editor

-- First, let's see what columns actually exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Drop and recreate the table if needed (WARNING: This will delete all profile data)
-- Uncomment the following lines ONLY if you want to start fresh
-- DROP TABLE IF EXISTS public.profiles CASCADE;

-- Recreate profiles table with all required columns
-- CREATE TABLE IF NOT EXISTS public.profiles (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
--   username TEXT NOT NULL,
--   tag TEXT NOT NULL,
--   email TEXT NOT NULL,
--   avatar TEXT,
--   bio TEXT,
--   tradingStyle TEXT CHECK (tradingStyle IN ('day-trader', 'swing-trader', 'investor', 'ecommerce')),
--   winRate NUMERIC CHECK (winRate >= 0 AND winRate <= 100),
--   totalTrades NUMERIC CHECK (totalTrades >= 0),
--   socialLinks JSONB DEFAULT '{}'::jsonb,
--   isOnline BOOLEAN DEFAULT false,
--   createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--   UNIQUE(username, tag)
-- );

-- Add missing columns if table exists
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
  END IF;
END $$;

-- Verify the final table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if there are any profiles
SELECT COUNT(*) as profile_count FROM public.profiles;

-- Show sample profile data if any exists
SELECT 
  id,
  username,
  tag,
  socialLinks,
  created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 3;
