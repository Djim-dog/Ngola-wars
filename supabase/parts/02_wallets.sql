-- ===== PARTE 2/10 — Carteira =====

CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  kingdom_capital NUMERIC(12,2) DEFAULT 0 CHECK (kingdom_capital >= 0),
  purchase_balance NUMERIC(12,2) DEFAULT 0 CHECK (purchase_balance >= 0),
  reward_balance NUMERIC(12,2) DEFAULT 0 CHECK (reward_balance >= 0),
  reserved_balance NUMERIC(12,2) DEFAULT 0 CHECK (reserved_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  CREATE TYPE wallet_transaction_type AS ENUM (
    'deposit_confirmed', 'shop_purchase', 'marketplace_sale',
    'marketplace_purchase', 'match_reward', 'kingdom_conquest_reward',
    'refund', 'withdrawal', 'admin_adjustment', 'initial_capital', 'commission'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type wallet_transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  component TEXT NOT NULL CHECK (component IN (
    'kingdom_capital', 'purchase_balance', 'reward_balance', 'reserved_balance'
  )),
  reference_id UUID,
  reference_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
