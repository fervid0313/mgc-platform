-- 🚨 QUICK ACCOUNT WIPE 🚨
-- Simple version - just delete everything in one go

-- Show current state
SELECT 'Current users before wipe:', COUNT(*) FROM auth.users;

-- Delete everything (RLS might block this, but let's try)
DELETE FROM public.likes;
DELETE FROM public.comments;
DELETE FROM public.space_members;
DELETE FROM public.entries;
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Verify
SELECT 'Users remaining after wipe:', COUNT(*) FROM auth.users;
SELECT '✅ WIPE COMPLETE!' as status;