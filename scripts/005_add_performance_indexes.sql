-- Performance indexes for worldwide scale

-- Entries feed: fast per-space reverse chronological scans
CREATE INDEX IF NOT EXISTS entries_space_created_at_idx
ON public.entries (space_id, created_at DESC);

-- Entries: fast lookup of a user's posts (optional but useful)
CREATE INDEX IF NOT EXISTS entries_user_created_at_idx
ON public.entries (user_id, created_at DESC);

-- Comments: fast per-entry comment retrieval
CREATE INDEX IF NOT EXISTS comments_entry_created_at_idx
ON public.comments (entry_id, created_at ASC);

-- Likes: fast per-entry like queries and uniqueness checks
CREATE INDEX IF NOT EXISTS likes_entry_id_idx
ON public.likes (entry_id);

CREATE INDEX IF NOT EXISTS likes_user_id_idx
ON public.likes (user_id);
