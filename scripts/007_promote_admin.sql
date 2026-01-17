-- Promote a user to administrator role
-- Replace the email with the target user's email

UPDATE public.profiles
SET role = 'admin'
WHERE email = 'uchisechi@gmail.com';

SELECT '✅ User promoted to admin' AS result;
