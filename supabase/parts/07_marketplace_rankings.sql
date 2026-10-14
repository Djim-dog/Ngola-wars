-- ===== PARTE 7/10 — Marketplace + Ranking =====

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  product_type TEXT NOT NULL,
  item_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id UUID REFERENCES public.profiles(id),
  sold_at TIMESTAMPTZ,
  commission_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rankings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  conquest_rank INTEGER,
  competitive_rank INTEGER,
  activity_rank INTEGER,
  conquest_score INTEGER DEFAULT 0,
  competitive_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
