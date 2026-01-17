-- Performance indexes for worldwide scale

-- Entries feed: fast per-space reverse chronological scans
CREATE INDEX IF NOT EXISTS entries_space_created_at_idx
ON public.entries (space_id, created_at DESC);

-- Entries: fast lookup of a user's posts (optional but useful)
CREATE INDEX IF NOT EXISTS entries_user_created_at_idx
ON public.entries (user_id, created_at DESC);

-- Friend requests: fast pending inbox/outbox
CREATE INDEX IF NOT EXISTS friend_requests_to_status_created_at_idx
ON public.friend_requests (to_user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS friend_requests_from_status_created_at_idx
ON public.friend_requests (from_user_id, status, created_at DESC);

-- Connections: fast friend lists
CREATE INDEX IF NOT EXISTS connections_user_id_idx
ON public.connections (user_id);

CREATE INDEX IF NOT EXISTS connections_friend_id_idx
ON public.connections (friend_id);

-- Comments: fast per-entry comment retrieval
CREATE INDEX IF NOT EXISTS comments_entry_created_at_idx
ON public.comments (entry_id, created_at ASC);

-- Likes: fast per-entry like queries and uniqueness checks
CREATE INDEX IF NOT EXISTS likes_entry_id_idx
ON public.likes (entry_id);

CREATE INDEX IF NOT EXISTS likes_user_id_idx
ON public.likes (user_id);

-- Chat messages: fast per-space chat retrieval
CREATE INDEX IF NOT EXISTS chat_messages_space_created_at_idx
ON public.chat_messages (space_id, created_at DESC);

-- Direct messages: fast conversation retrieval
CREATE INDEX IF NOT EXISTS direct_messages_sender_created_at_idx
ON public.direct_messages (sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS direct_messages_receiver_created_at_idx
ON public.direct_messages (receiver_id, created_at DESC);
