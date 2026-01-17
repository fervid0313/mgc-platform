-- Safe database setup that handles existing policies
-- Run this instead of the individual scripts if you get policy errors

-- First, drop existing policies if they exist (safe to run multiple times)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    -- Drop all existing policies on our tables
    FOR policy_record IN
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'spaces', 'space_members', 'entries', 'comments', 'likes')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON ' || quote_ident(policy_record.schemaname) || '.' || quote_ident(policy_record.tablename);
        RAISE NOTICE 'Dropped policy: %.%', policy_record.tablename, policy_record.policyname;
    END LOOP;
END;
$$;

-- Ensure RLS is enabled (safe to run multiple times)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Recreate all policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY "spaces_select_public" ON public.spaces FOR SELECT USING (
  is_public_group = true OR
  owner_id = auth.uid() OR
  id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
);

CREATE POLICY "space_members_select" ON public.space_members FOR SELECT USING (true);
CREATE POLICY "space_members_insert" ON public.space_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "space_members_delete_own" ON public.space_members FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "entries_select" ON public.entries FOR SELECT USING (
  space_id IN (
    SELECT id FROM public.spaces WHERE is_public_group = true
    UNION
    SELECT space_id FROM public.space_members WHERE user_id = auth.uid()
  )
);
CREATE POLICY "entries_insert_own" ON public.entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "entries_update_own" ON public.entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "entries_delete_own" ON public.entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Add any missing columns (safe to run multiple times)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Add missing username columns
ALTER TABLE entries ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Rename pnl to profit_loss if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='pnl')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='profit_loss') THEN
    ALTER TABLE entries RENAME COLUMN pnl TO profit_loss;
  END IF;
END $$;

-- Insert default Global Feed space if it doesn't exist
INSERT INTO spaces (id, name, description, owner_id, is_private, member_count)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Global Feed',
  'Public space for the entire MGS community',
  '00000000-0000-0000-0000-000000000000',
  false,
  9999
)
ON CONFLICT (id) DO NOTHING;

SELECT '✅ Database setup complete! All policies recreated and columns added.' as result;