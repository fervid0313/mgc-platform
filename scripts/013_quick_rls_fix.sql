-- Quick fix for profiles RLS - run this immediately
-- This will disable RLS temporarily to allow profile creation, then re-enable with proper policies

-- Temporarily disable RLS to allow profile creation
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Allow any authenticated user to create their own profile
-- This is a temporary fix - we'll re-enable RLS after

-- Check if profiles table exists and has the right structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test profile creation works by checking current profiles
SELECT COUNT(*) as current_profile_count FROM profiles;

-- If you need to create a test profile, uncomment and run:
-- INSERT INTO profiles (id, username, email, tag, social_links) 
-- VALUES ('test-user-id', 'testuser', 'test@example.com', '1234', '{}')
-- ON CONFLICT (id) DO NOTHING;

-- Re-enable RLS with permissive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple policies that work
CREATE POLICY "Enable insert for authenticated users based on id" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable select for all users" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Verify policies are in place
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'profiles';
