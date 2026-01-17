-- Debug script to check entries table status
-- Run this in Supabase SQL Editor to see what's happening

-- 1. Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'entries'
) as entries_table_exists;

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'entries'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'entries'
ORDER BY policyname;

-- 4. Check row count
SELECT COUNT(*) as total_rows FROM public.entries;

-- 5. Sample data (if any)
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  image IS NOT NULL as has_image,
  created_at
FROM public.entries 
ORDER BY created_at DESC 
LIMIT 3;
