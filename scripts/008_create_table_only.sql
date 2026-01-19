-- Just create the table and function (policies already exist)
-- Run this in Supabase SQL Editor

-- Create space_invite_links table (if it doesn't exist)
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

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_space_invite_links_token ON public.space_invite_links(token);
CREATE INDEX IF NOT EXISTS idx_space_invite_links_space_id ON public.space_invite_links(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invite_links_email ON public.space_invite_links(email);

-- Drop and recreate the function
DROP FUNCTION IF EXISTS join_space_via_invite_link(p_token TEXT, p_user_id UUID);

-- Function to join space via invite link
CREATE OR REPLACE FUNCTION join_space_via_invite_link(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS '
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
' LANGUAGE plpgsql SECURITY DEFINER;
