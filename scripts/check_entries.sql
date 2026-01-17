-- Check if entries exist in the database
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN image IS NOT NULL THEN 1 END) as entries_with_images,
  COUNT(CASE WHEN pnl IS NOT NULL THEN 1 END) as entries_with_pnl,
  COUNT(CASE WHEN content IS NOT NULL THEN 1 END) as entries_with_content
FROM public.entries;

-- Show sample entries to verify data exists
SELECT 
  id,
  LEFT(content, 50) as content_preview,
  pnl,
  image IS NOT NULL as has_image,
  created_at
FROM public.entries 
ORDER BY created_at DESC 
LIMIT 5;
