-- Add username column to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS username TEXT;

-- Add username column to comments table
ALTER TABLE comments ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS avatar TEXT;

-- Rename pnl column to profit_loss in entries table to match code expectations
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='pnl') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='entries' AND column_name='profit_loss') THEN
    ALTER TABLE entries RENAME COLUMN pnl TO profit_loss;
  END IF;
END $$;
