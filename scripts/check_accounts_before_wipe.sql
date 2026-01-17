-- Check what data exists before wiping accounts
-- Run this first to see what will be deleted

-- Count total users
SELECT 'Total Users' as data_type, COUNT(*) as count FROM auth.users;

-- Count profiles
SELECT 'User Profiles' as data_type, COUNT(*) as count FROM public.profiles;

-- Count journal entries
SELECT 'Journal Entries' as data_type, COUNT(*) as count FROM public.entries;

-- Count friend requests
SELECT 'Friend Requests' as data_type, COUNT(*) as count FROM public.friend_requests;

-- Count connections/friends
SELECT 'Friend Connections' as data_type, COUNT(*) as count FROM public.connections;

-- Count space members
SELECT 'Space Members' as data_type, COUNT(*) as count FROM public.space_members;

-- Count comments
SELECT 'Comments' as data_type, COUNT(*) as count FROM public.comments;

-- Count likes
SELECT 'Likes' as data_type, COUNT(*) as count FROM public.likes;

-- Count chat messages
SELECT 'Chat Messages' as data_type, COUNT(*) as count FROM public.chat_messages;

-- List all user emails (to see who will be deleted)
SELECT email FROM auth.users ORDER BY created_at DESC;