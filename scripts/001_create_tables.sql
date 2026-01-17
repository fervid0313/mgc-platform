-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  tag TEXT NOT NULL,
  avatar TEXT,
  bio TEXT,
  specialty TEXT,
  win_rate NUMERIC DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  is_online BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username, tag)
);

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- Create connections (friends) table
CREATE TABLE IF NOT EXISTS public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

-- Create spaces table
CREATE TABLE IF NOT EXISTS public.spaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  is_private BOOLEAN DEFAULT false,
  is_public_group BOOLEAN DEFAULT false,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create space_members table
CREATE TABLE IF NOT EXISTS public.space_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, user_id)
);

-- Create entries (journal posts) table
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  trade_type TEXT,
  pnl NUMERIC,
  tags TEXT[] DEFAULT '{}',
  image TEXT,
  mental_state TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(entry_id, user_id)
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create direct_messages table for friend-to-friend chat
CREATE TABLE IF NOT EXISTS public.direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.space_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- Friend requests policies
CREATE POLICY "friend_requests_select_own" ON public.friend_requests FOR SELECT 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "friend_requests_insert_own" ON public.friend_requests FOR INSERT 
  WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "friend_requests_update_own" ON public.friend_requests FOR UPDATE 
  USING (auth.uid() = to_user_id);
CREATE POLICY "friend_requests_delete_own" ON public.friend_requests FOR DELETE 
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Connections policies
CREATE POLICY "connections_select_own" ON public.connections FOR SELECT 
  USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "connections_insert_own" ON public.connections FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "connections_delete_own" ON public.connections FOR DELETE 
  USING (auth.uid() = user_id);

-- Spaces policies (public groups visible to all, private only to members)
CREATE POLICY "spaces_select_public" ON public.spaces FOR SELECT USING (
  is_public_group = true OR 
  owner_id = auth.uid() OR 
  id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
);
CREATE POLICY "spaces_insert_own" ON public.spaces FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "spaces_update_own" ON public.spaces FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "spaces_delete_own" ON public.spaces FOR DELETE USING (auth.uid() = owner_id);

-- Space members policies
CREATE POLICY "space_members_select" ON public.space_members FOR SELECT USING (true);
CREATE POLICY "space_members_insert" ON public.space_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "space_members_delete_own" ON public.space_members FOR DELETE USING (auth.uid() = user_id);

-- Entries policies (visible in spaces user is member of, or public groups)
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

-- Comments policies
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "likes_select" ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_own" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_own" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "chat_messages_select" ON public.chat_messages FOR SELECT USING (
  space_id IN (SELECT space_id FROM public.space_members WHERE user_id = auth.uid())
);
CREATE POLICY "chat_messages_insert_own" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "direct_messages_select" ON public.direct_messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "direct_messages_insert_own" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "direct_messages_delete_own" ON public.direct_messages FOR DELETE USING (auth.uid() = sender_id);

-- Insert default public spaces (Global Feed and public groups)
INSERT INTO public.spaces (id, name, description, icon, is_private, is_public_group) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Global Feed', 'Share with everyone', 'globe', false, true),
  ('00000000-0000-0000-0000-000000000002', 'e-Commerce', 'Online stores & dropshipping', 'shopping-cart', false, true),
  ('00000000-0000-0000-0000-000000000003', 'Brand Scaling', 'Grow your brand', 'trending-up', false, true),
  ('00000000-0000-0000-0000-000000000004', 'Day Trading', 'Intraday strategies', 'activity', false, true),
  ('00000000-0000-0000-0000-000000000005', 'Investments', 'Long-term plays', 'bar-chart-2', false, true),
  ('00000000-0000-0000-0000-000000000006', 'Other', 'General topics', 'message-circle', false, true)
ON CONFLICT DO NOTHING;
