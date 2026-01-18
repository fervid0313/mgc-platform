-- Simple check of pnl data without type casting
-- Run this in Supabase SQL Editor

-- Check all entries with their pnl values
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  CASE 
    WHEN pnl IS NULL THEN 'NULL'
    ELSE 'HAS VALUE'
  END as pnl_status
FROM public.entries 
ORDER BY created_at DESC;

-- Check specific entry
SELECT 
  id,
  content,
  pnl,
  image,
  created_at
FROM public.entries 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';
