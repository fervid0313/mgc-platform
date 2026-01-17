-- Add missing columns to entries table
-- Run this in Supabase SQL Editor

-- Add pnl column for profit/loss data
ALTER TABLE public.entries 
ADD COLUMN IF NOT EXISTS pnl NUMERIC;

-- Add image column for trade proof images  
ALTER TABLE public.entries
ADD COLUMN IF NOT EXISTS image TEXT;

-- Verify columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'entries'
  AND column_name IN ('pnl', 'image')
ORDER BY ordinal_position;

-- Check if any existing entries have data in these columns
SELECT 
  COUNT(*) as total_entries,
  COUNT(CASE WHEN pnl IS NOT NULL THEN 1 END) as entries_with_pnl,
  COUNT(CASE WHEN image IS NOT NULL THEN 1 END) as entries_with_image
FROM public.entries;
