-- Update the join function to work with shared links (no email validation)
-- Run this in Supabase SQL Editor

-- Drop and recreate the function without email validation
DROP FUNCTION IF EXISTS join_space_via_invite_link(p_token TEXT, p_user_id UUID);

-- Function to join space via invite link (shared links)
CREATE OR REPLACE FUNCTION join_space_via_invite_link(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS '
DECLARE
  invite_link RECORD;
BEGIN
  -- Find and validate the invite link (no email check for shared links)
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
