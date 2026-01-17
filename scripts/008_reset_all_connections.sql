-- Reset all connections to 0 for every user
-- Run this once to clean up any existing auto-friend connections

DELETE FROM public.connections;

SELECT '✅ All connections reset to 0' AS result;
