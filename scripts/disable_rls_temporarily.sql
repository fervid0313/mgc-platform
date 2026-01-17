-- TEMPORARILY DISABLE RLS FOR DEBUGGING
-- ONLY RUN THIS IF YOU'RE SURE AND RE-ENABLE AFTERWARDS

-- Disable RLS on entries table
ALTER TABLE public.entries DISABLE ROW LEVEL SECURITY;

-- Check if we can now access entries
SELECT COUNT(*) as total_entries FROM public.entries;

-- Show sample entries
SELECT 
  id,
  LEFT(content, 50) as content_preview,
  pnl,
  image IS NOT NULL as has_image,
  created_at
FROM public.entries 
ORDER BY created_at DESC 
LIMIT 5;

-- RE-ENABLE RLS AFTER DEBUGGING
-- ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
