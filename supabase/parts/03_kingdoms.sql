-- ===== PARTE 3/10 — Reinos =====

DO $$ BEGIN
  CREATE TYPE kingdom_status AS ENUM ('protected', 'available', 'in_battle');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.kingdoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  map_x INTEGER NOT NULL,
  map_y INTEGER NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  capital NUMERIC(12,2) DEFAULT 0,
  level INTEGER DEFAULT 1,
  status kingdom_status DEFAULT 'available',
  protected_until TIMESTAMPTZ,
  bounty_potential NUMERIC(10,2) DEFAULT 0.50,
  times_conquered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kingdoms_owner ON public.kingdoms(owner_id);
CREATE INDEX IF NOT EXISTS idx_kingdoms_status ON public.kingdoms(status);
