-- Watched economic events for in-app reminders
CREATE TABLE IF NOT EXISTS public.watched_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_fingerprint text NOT NULL, -- e.g. "2026-02-04|ISM Manufacturing PMI|8:30 AM"
  event_name text NOT NULL,
  event_time text NOT NULL,
  event_date text NOT NULL, -- YYYY-MM-DD
  impact text NOT NULL CHECK (impact IN ('High', 'Medium', 'Low')),
  lead_minutes integer NOT NULL CHECK (lead_minutes IN (1, 5, 15)),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, event_fingerprint)
);

-- Index for fast lookup of upcoming reminders per user
CREATE INDEX idx_watched_events_user_time ON public.watched_events(user_id, event_date, event_time);

-- RLS: Users can only manage their own watched events
ALTER TABLE public.watched_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watched events" ON public.watched_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watched events" ON public.watched_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watched events" ON public.watched_events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watched events" ON public.watched_events
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_watched_events_updated_at
  BEFORE UPDATE ON public.watched_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
