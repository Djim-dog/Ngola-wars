-- ===== PARTE 6/10 — Loja =====

DO $$ BEGIN
  CREATE TYPE shop_category AS ENUM (
    'pieces', 'protection', 'training', 'cosmetics', 'season_pass'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category shop_category NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  piece_quantity INTEGER DEFAULT 0,
  duration_hours INTEGER,
  effect_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id UUID NOT NULL REFERENCES public.shop_products(id),
  quantity INTEGER DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  transaction_id UUID REFERENCES public.wallet_transactions(id),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
