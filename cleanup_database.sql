-- CLEANUP: Remove all recent database changes
-- Run this to revert database to previous state

-- Remove the trigger we added
DROP TRIGGER IF EXISTS trigger_auto_create_profile ON auth.users;

-- Remove the function we added
DROP FUNCTION IF EXISTS auto_create_profile();

-- Remove any other functions we might have added
DROP FUNCTION IF EXISTS handle_new_user();

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';
SELECT pg_sleep(1);
NOTIFY pgrst, 'reload schema';

-- Show current state
SELECT 'Database cleanup completed' as status;
SELECT COUNT(*) as current_profiles FROM profiles;
