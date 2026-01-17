-- Set password for fervid2023@gmail.com to Dustin#12
-- This updates the password hash in Supabase Auth

-- Note: This requires admin access to the auth schema
-- In Supabase dashboard, you can update user passwords directly

-- Alternative: Send password reset email
-- Or use the Supabase client to update password

-- For development/testing, you can also:
-- 1. Delete the existing user
-- 2. Create a new user with the desired credentials

-- Delete existing user if it exists
DELETE FROM auth.users WHERE email = 'fervid2023@gmail.com';

-- Note: Password hashing is handled by Supabase Auth
-- You cannot directly set passwords via SQL
-- Use the dashboard or API instead