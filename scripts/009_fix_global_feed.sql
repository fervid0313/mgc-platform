-- Fix Global Feed space access issues
-- This ensures the Global Feed space exists and is properly configured

-- First, ensure the Global Feed space exists and is marked as public
INSERT INTO public.spaces (
  id, 
  name, 
  description, 
  owner_id, 
  is_private, 
  is_public_group,
  created_at,
  member_count
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Global Feed',
  'Public space for the entire MGS community',
  'system',
  false,
  true,
  NOW(),
  9999
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_private = EXCLUDED.is_private,
  is_public_group = EXCLUDED.is_public_group;

-- Ensure all existing users are members of the Global Feed space
INSERT INTO public.space_members (space_id, user_id)
SELECT '00000000-0000-0000-0000-000000000001', id
FROM public.profiles
WHERE id NOT IN (
  SELECT user_id FROM public.space_members 
  WHERE space_id = '00000000-0000-0000-0000-000000000001'
) ON CONFLICT DO NOTHING;

-- Verify the fix
SELECT 'Global Feed space exists' as status, COUNT(*) as count 
FROM public.spaces 
WHERE id = '00000000-0000-0000-0000-000000000001' AND is_public_group = true;

SELECT 'Global Feed memberships' as status, COUNT(*) as count 
FROM public.space_members 
WHERE space_id = '00000000-0000-0000-0000-000000000001';

SELECT 'Global Feed entries' as status, COUNT(*) as count 
FROM public.entries 
WHERE space_id = '00000000-0000-0000-0000-000000000001';
