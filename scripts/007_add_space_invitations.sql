-- Add space invitations table
-- Run this in Supabase SQL Editor

-- Create space_invitations table
CREATE TABLE IF NOT EXISTS public.space_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  space_id UUID NOT NULL REFERENCES public.spaces(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_email TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(space_id, invitee_email, status)
);

-- Add RLS policies
ALTER TABLE public.space_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see invitations for their spaces or sent to them
CREATE POLICY "Users can view space invitations" ON public.space_invitations
  FOR SELECT USING (
    auth.uid() = inviter_id OR 
    auth.uid() = invitee_id OR
    EXISTS (
      SELECT 1 FROM public.space_members 
      WHERE space_id = public.space_invitations.space_id 
        AND user_id = auth.uid()
    )
  );

-- Policy: Users can create invitations for spaces they're members of
CREATE POLICY "Users can create space invitations" ON public.space_invitations
  FOR INSERT WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM public.space_members 
      WHERE space_id = public.space_invitations.space_id 
        AND user_id = auth.uid()
    )
  );

-- Policy: Users can update their own invitations
CREATE POLICY "Users can update space invitations" ON public.space_invitations
  FOR UPDATE USING (
    auth.uid() = invitee_id
  );

-- Policy: Users can delete invitations they sent
CREATE POLICY "Users can delete space invitations" ON public.space_invitations
  FOR DELETE USING (
    auth.uid() = inviter_id OR auth.uid() = invitee_id
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_space_invitations_space_id ON public.space_invitations(space_id);
CREATE INDEX IF NOT EXISTS idx_space_invitations_invitee_id ON public.space_invitations(invitee_id);
CREATE INDEX IF NOT EXISTS idx_space_invitations_status ON public.space_invitations(status);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_space_invitations_updated_at 
    BEFORE UPDATE ON public.space_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
