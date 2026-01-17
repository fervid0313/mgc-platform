-- Check if all required tables exist
SELECT 'Checking MGS Database Setup...' as status;

-- Check auth users
SELECT 'Auth Users' as table_name, COUNT(*) as record_count FROM auth.users;

-- Check main tables
SELECT 'Profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'Entries', COUNT(*) FROM public.entries
UNION ALL
SELECT 'Friend Requests', COUNT(*) FROM public.friend_requests
UNION ALL
SELECT 'Connections', COUNT(*) FROM public.connections
UNION ALL
SELECT 'Chat Messages', COUNT(*) FROM public.chat_messages
UNION ALL
SELECT 'Comments', COUNT(*) FROM public.comments
UNION ALL
SELECT 'Likes', COUNT(*) FROM public.likes
UNION ALL
SELECT 'Spaces', COUNT(*) FROM public.spaces
UNION ALL
SELECT 'Space Members', COUNT(*) FROM public.space_members;

-- Check if tables exist at all
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'entries', 'friend_requests', 'connections', 'chat_messages', 'comments', 'likes', 'spaces', 'space_members')
ORDER BY table_name;