-- 🚨 COMPLETE ACCOUNT WIPE SCRIPT 🚨
-- This will DELETE ALL USER ACCOUNTS and DATA permanently!
-- Run at your own risk - this cannot be undone!

-- First, let's see what we're about to delete
SELECT 'BEFORE WIPE - Current Data Counts:' as status;
SELECT 'Users' as data_type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Entries', COUNT(*) FROM public.entries
UNION ALL
SELECT 'Comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'Likes', COUNT(*) FROM public.likes;

-- STEP 1: Disable RLS temporarily to ensure deletion works
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- STEP 2: Delete all user-generated content (in correct dependency order)
DELETE FROM public.likes;
DELETE FROM public.comments;
DELETE FROM public.space_members;
DELETE FROM public.entries;

-- STEP 3: Delete user profiles
DELETE FROM public.profiles;

-- STEP 4: Finally, delete all auth users (this cascades to everything)
-- This is the nuclear option - deletes all Supabase Auth accounts!
DELETE FROM auth.users;

-- STEP 5: Re-enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- STEP 6: Verify the wipe worked
SELECT 'AFTER WIPE - Data Counts (should all be 0):' as status;
SELECT 'Users' as data_type, COUNT(*) as count FROM auth.users
UNION ALL
SELECT 'Profiles', COUNT(*) FROM public.profiles
UNION ALL
SELECT 'Entries', COUNT(*) FROM public.entries
UNION ALL
SELECT 'Comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'Likes', COUNT(*) FROM public.likes;

-- Success message
SELECT '✅ ACCOUNT WIPE COMPLETE! All user data has been permanently deleted.' as result;
SELECT '🔄 You can now create fresh test accounts.' as next_step;