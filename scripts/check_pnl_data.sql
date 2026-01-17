-- Check what's actually stored in the pnl column
-- Run this in Supabase SQL Editor

-- Check the data type and actual values
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  pg_typeof(pnl) as pnl_data_type,
  CASE 
    WHEN pnl IS NULL THEN 'NULL'
    WHEN pnl = '' THEN 'EMPTY STRING'
    WHEN pnl::text ~ '^[0-9.-]+$' THEN 'NUMERIC TEXT'
    ELSE 'OTHER TEXT'
  END as pnl_format
FROM public.entries 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';

-- Try to cast it to numeric to see if it works
SELECT 
  id,
  pnl,
  pnl::NUMERIC as pnl_as_numeric
FROM public.entries 
WHERE id = '8d91e406-5732-4d09-9be9-a75fedbee123';
