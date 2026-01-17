-- Rename specialty column to trading_style in profiles table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='specialty')
     AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='trading_style') THEN
    ALTER TABLE public.profiles RENAME COLUMN specialty TO trading_style;
  END IF;
END $$;