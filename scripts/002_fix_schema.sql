-- Add email column to profiles if it doesn't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- Add member_count column to spaces if it doesn't exist
ALTER TABLE spaces ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Create a fixed UUID for the global space
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
