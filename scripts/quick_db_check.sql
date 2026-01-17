-- Quick check of what's actually in the database
-- Run this in Supabase SQL Editor

-- Check all entries with their pnl and image data
SELECT 
  id,
  LEFT(content, 30) as content_preview,
  pnl,
  CASE WHEN image IS NOT NULL THEN 'has image' ELSE 'no image' END as image_status,
  created_at
FROM public.entries 
ORDER BY created_at DESC;

-- Check if the specific entry from debug output has pnl/image
SELECT 
  id,
  content,
  pnl,
  image,
  created_at
FROM public.entries 
WHERE id = '0d846120-d140-44d9-b826-f4f39213385a';
