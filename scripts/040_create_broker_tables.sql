-- Create linked_accounts table for broker connections
CREATE TABLE IF NOT EXISTS public.linked_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL CHECK (broker IN ('tradovate', 'projectx')),
  credentials JSONB NOT NULL DEFAULT '{}',
  environment TEXT NOT NULL DEFAULT 'demo' CHECK (environment IN ('demo', 'live')),
  is_active BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, broker)
);

-- Create imported_trades table for synced trades
CREATE TABLE IF NOT EXISTS public.imported_trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker TEXT NOT NULL CHECK (broker IN ('tradovate', 'projectx')),
  external_id TEXT,
  symbol TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('long', 'short')),
  entry_price NUMERIC,
  exit_price NUMERIC,
  quantity NUMERIC,
  pnl NUMERIC,
  fees NUMERIC DEFAULT 0,
  opened_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  raw_data JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'dismissed')),
  posted_entry_id UUID REFERENCES public.entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, broker, external_id)
);

-- RLS policies for linked_accounts (users can only see/manage their own)
ALTER TABLE public.linked_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "linked_accounts_select_own" ON public.linked_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "linked_accounts_insert_own" ON public.linked_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "linked_accounts_update_own" ON public.linked_accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "linked_accounts_delete_own" ON public.linked_accounts FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for imported_trades (users can only see/manage their own)
ALTER TABLE public.imported_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imported_trades_select_own" ON public.imported_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "imported_trades_insert_own" ON public.imported_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "imported_trades_update_own" ON public.imported_trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "imported_trades_delete_own" ON public.imported_trades FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_imported_trades_user_status ON public.imported_trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_imported_trades_user_broker ON public.imported_trades(user_id, broker);
CREATE INDEX IF NOT EXISTS idx_linked_accounts_user ON public.linked_accounts(user_id);
