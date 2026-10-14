-- ===== PARTE 1/10 — Extensões + Perfis =====
-- Copia tudo e corre no SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_kingdoms_conquered INTEGER DEFAULT 0,
  ranking_points INTEGER DEFAULT 0,
  free_recovery_used BOOLEAN DEFAULT FALSE,
  extra_life_used BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);
