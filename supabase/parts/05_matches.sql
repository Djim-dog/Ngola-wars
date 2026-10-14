-- ===== PARTE 5/10 — Partidas =====

DO $$ BEGIN
  CREATE TYPE match_status AS ENUM (
    'pending', 'active', 'finished', 'cancelled', 'abandoned'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE match_type AS ENUM ('vs_computer', 'vs_player', 'tournament');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id UUID REFERENCES public.kingdoms(id),
  match_type match_type NOT NULL DEFAULT 'vs_computer',
  status match_status DEFAULT 'pending',
  challenger_id UUID NOT NULL REFERENCES public.profiles(id),
  defender_id UUID REFERENCES public.profiles(id),
  winner_id UUID REFERENCES public.profiles(id),
  board_state JSONB DEFAULT '[]',
  current_turn UUID,
  move_history JSONB DEFAULT '[]',
  challenger_pieces JSONB DEFAULT '[]',
  defender_pieces JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_challenger ON public.matches(challenger_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON public.matches(status);
