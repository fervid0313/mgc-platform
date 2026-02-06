ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS symbol text,
  ADD COLUMN IF NOT EXISTS strategy text,
  ADD COLUMN IF NOT EXISTS timeframe text,
  ADD COLUMN IF NOT EXISTS direction text,
  ADD COLUMN IF NOT EXISTS entry_price numeric,
  ADD COLUMN IF NOT EXISTS exit_price numeric,
  ADD COLUMN IF NOT EXISTS stop_loss numeric,
  ADD COLUMN IF NOT EXISTS take_profit numeric,
  ADD COLUMN IF NOT EXISTS risk_amount numeric,
  ADD COLUMN IF NOT EXISTS risk_percent numeric,
  ADD COLUMN IF NOT EXISTS r_multiple numeric,
  ADD COLUMN IF NOT EXISTS position_size numeric;

CREATE INDEX IF NOT EXISTS idx_entries_symbol ON public.entries(symbol);
CREATE INDEX IF NOT EXISTS idx_entries_strategy ON public.entries(strategy);
CREATE INDEX IF NOT EXISTS idx_entries_created_at_desc ON public.entries(created_at DESC);
