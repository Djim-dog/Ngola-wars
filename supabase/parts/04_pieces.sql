-- ===== PARTE 4/10 — Peças =====

DO $$ BEGIN
  CREATE TYPE piece_type AS ENUM ('normal', 'premium', 'special');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.piece_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type piece_type DEFAULT 'normal',
  max_health INTEGER DEFAULT 1,
  special_ability TEXT,
  is_cosmetic BOOLEAN DEFAULT FALSE,
  shop_price NUMERIC(10,2),
  is_available_in_shop BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.player_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.piece_templates(id),
  is_alive BOOLEAN DEFAULT TRUE,
  health INTEGER DEFAULT 1,
  origin TEXT DEFAULT 'purchased' CHECK (origin IN (
    'purchased', 'free_recovery', 'initial', 'reward'
  )),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  destroyed_at TIMESTAMPTZ,
  destroyed_in_match_id UUID
);

CREATE INDEX IF NOT EXISTS idx_player_pieces_user ON public.player_pieces(user_id);
CREATE INDEX IF NOT EXISTS idx_player_pieces_alive ON public.player_pieces(user_id, is_alive);
