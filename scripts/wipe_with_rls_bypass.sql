-- 🚨 ACCOUNT WIPE WITH RLS BYPASS 🚨
-- This version temporarily bypasses RLS policies to ensure deletion works

-- Method 1: Try direct deletion first (might fail due to RLS)
DO $$
BEGIN
    -- Try to delete with RLS enabled first
    DELETE FROM public.likes;
    DELETE FROM public.comments;
    DELETE FROM public.space_members;
    DELETE FROM public.entries;
    DELETE FROM public.profiles;
    DELETE FROM auth.users;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Direct deletion failed, trying with RLS disabled...';
END;
$$;

-- Method 2: If Method 1 failed, disable RLS and try again
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Now delete everything
DELETE FROM public.likes;
DELETE FROM public.comments;
DELETE FROM public.space_members;
DELETE FROM public.entries;
DELETE FROM public.profiles;
DELETE FROM auth.users;

-- Re-enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Final verification
SELECT 'FINAL RESULT - Users remaining:', COUNT(*) FROM auth.users;