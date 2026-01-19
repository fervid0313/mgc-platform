-- Add space invite links table
-- Run this in Supabase SQL Editor

-- Create space_invite_links table
CREATE TABLE IF NOT EXISTS public.space_invite_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  message TEXT,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Add RLS policies
ALTER TABLE public.space_invite_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invite links they created
CREATE POLICY "Users can view their own invite links" ON public.space_invite_links
  FOR SELECT USING (auth.uid() = creator_id);

-- Policy: Users can create invite links for spaces they're members of
CREATE POLICY "Users can create invite links" ON public.space_invite_links
  FOR INSERT WITH CHECK (
    auth.uid() = creator_id AND
    EXISTS (
      SELECT 1 FROM public.space_members 
      WHERE space_id = public.space_invite_links.space_id 
        AND user_id = auth.uid()
    )
  );

-- Policy: Users can delete invite links they created
CREATE POLICY "Users can delete invite links" ON public.space_invite_links
  FOR DELETE USING (auth.uid() = creator_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_space_invite_links_token ON public.space_invite_links(token);
CREATE INDEX IF NOT EXISTS idx_space_invite_links_space_id ON public.space_invite_links(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invite_links_email ON public.space_invite_links(email);

-- Function to generate secure token
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to join space via invite link
CREATE OR REPLACE FUNCTION join_space_via_invite_link(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  invite_link RECORD;
BEGIN
  -- Find and validate the invite link
  SELECT * INTO invite_link 
  FROM public.space_invite_links 
  WHERE token = p_token 
    AND used = FALSE 
    AND expires_at > NOW()
    FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Add user to space members
  INSERT INTO public.space_members (space_id, user_id)
  VALUES (invite_link.space_id, p_user_id)
  ON CONFLICT DO NOTHING;
  
  -- Mark invite link as used
  UPDATE public.space_invite_links 
  SET used = TRUE, used_at = NOW()
  WHERE id = invite_link.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
