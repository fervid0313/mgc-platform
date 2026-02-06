-- Fix notifications RLS so every account can read/update their own notifications
-- Run in Supabase SQL editor

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- SELECT: user can view own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Users can view own notifications'
  ) THEN
    CREATE POLICY "Users can view own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END$$;

-- UPDATE: user can mark own notifications read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Users can update own notifications'
  ) THEN
    CREATE POLICY "Users can update own notifications" ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Optional: allow users to delete their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Users can delete own notifications'
  ) THEN
    CREATE POLICY "Users can delete own notifications" ON public.notifications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Service role: allow full read for admin verification endpoint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'Service role can view all notifications'
  ) THEN
    CREATE POLICY "Service role can view all notifications" ON public.notifications
      FOR SELECT USING ((auth.jwt() ->> 'role') = 'service_role');
  END IF;
END$$;
