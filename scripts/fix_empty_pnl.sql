-- Fix empty string pnl values by setting them to NULL
-- Run this in Supabase SQL Editor

-- First, check what we have
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  CASE 
    WHEN pnl IS NULL THEN 'NULL'
    WHEN pnl = '' THEN 'EMPTY STRING'
    ELSE 'HAS VALUE'
  END as pnl_status
FROM public.entries 
ORDER BY created_at DESC;

-- Fix empty strings by setting them to NULL
UPDATE public.entries 
SET pnl = NULL 
WHERE pnl = '';

-- Update with a test value to verify it works
UPDATE public.entries 
SET pnl = 999.00 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';

-- Verify the fix
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  created_at
FROM public.entries 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';
