-- Safe way to fix pnl data without type casting errors
-- Run this in Supabase SQL Editor

-- Check current data without casting
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  created_at
FROM public.entries 
ORDER BY created_at DESC;

-- Update the specific entry with a proper numeric value
UPDATE public.entries 
SET pnl = 999.00 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';

-- Verify the update
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  created_at
FROM public.entries 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';
