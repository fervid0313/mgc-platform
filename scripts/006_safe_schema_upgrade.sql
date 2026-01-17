-- Safe schema upgrade for multi-user / worldwide use
-- Adds missing columns expected by the app without breaking existing installs.

-- Profiles: optional fields used by UI
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trading_style TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS win_rate NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_trades INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Spaces: member_count is referenced by UI
ALTER TABLE public.spaces ADD COLUMN IF NOT EXISTS member_count INTEGER DEFAULT 0;

-- Entries: username and profit_loss are referenced by the app
ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS username TEXT;

-- Support both schemas: some installs have pnl, others profit_loss
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='entries' AND column_name='pnl'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='entries' AND column_name='profit_loss'
  ) THEN
    ALTER TABLE public.entries RENAME COLUMN pnl TO profit_loss;
  END IF;
END $$;

ALTER TABLE public.entries ADD COLUMN IF NOT EXISTS profit_loss NUMERIC;

-- Comments: app expects username/avatar for display
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS avatar TEXT;

SELECT '✅ Safe schema upgrade complete' AS result;
