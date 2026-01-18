-- Add social connections table
-- Run this in Supabase SQL Editor

-- Create social connections table
CREATE TABLE IF NOT EXISTS public.social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, requested_id)
);

-- Add RLS policies for social connections
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "social_connections_select" ON public.social_connections FOR SELECT USING (
  (
    requester_id = auth.uid() OR 
    requested_id = auth.uid()
  )
);

CREATE POLICY "social_connections_insert_own" ON public.social_connections FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "social_connections_update_own" ON public.social_connections FOR UPDATE USING (
  auth.uid() = requester_id
);

CREATE POLICY "social_connections_delete_own" ON public.social_connections FOR DELETE USING (
  auth.uid() = requester_id
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_social_connections_requester ON public.social_connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_requested ON public.social_connections(requested_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_status ON public.social_connections(status);
CREATE INDEX IF NOT EXISTS idx_social_connections_created_at ON public.social_connections(created_at);
