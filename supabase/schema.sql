-- ============================================
-- KINGDOM CHECKERS - Schema Completo V1.0
-- Supabase / PostgreSQL
-- ============================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PERFIS (extensão do auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Progressão
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_kingdoms_conquered INTEGER DEFAULT 0,
  ranking_points INTEGER DEFAULT 0,
  -- Recuperação
  free_recovery_used BOOLEAN DEFAULT FALSE,
  extra_life_used BOOLEAN DEFAULT FALSE,
  -- Status
  is_banned BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CARTEIRA (4 componentes conforme documento)
-- ============================================
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  -- Capital do reino (virtual, para elegibilidade de batalhas)
  kingdom_capital NUMERIC(12,2) DEFAULT 0 CHECK (kingdom_capital >= 0),
  -- Saldo de compras (para loja)
  purchase_balance NUMERIC(12,2) DEFAULT 0 CHECK (purchase_balance >= 0),
  -- Saldo de recompensas (elegível para levantamento futuro)
  reward_balance NUMERIC(12,2) DEFAULT 0 CHECK (reward_balance >= 0),
  -- Saldo reservado (em transações pendentes)
  reserved_balance NUMERIC(12,2) DEFAULT 0 CHECK (reserved_balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. HISTÓRICO DA CARTEIRA (imutável / auditável)
-- ============================================
CREATE TYPE wallet_transaction_type AS ENUM (
  'deposit_confirmed',
  'shop_purchase',
  'marketplace_sale',
  'marketplace_purchase',
  'match_reward',
  'kingdom_conquest_reward',
  'refund',
  'withdrawal',
  'admin_adjustment',
  'initial_capital',
  'commission'
);

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  type wallet_transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  component TEXT NOT NULL CHECK (component IN ('kingdom_capital', 'purchase_balance', 'reward_balance', 'reserved_balance')),
  reference_id UUID, -- partida, compra, etc.
  reference_type TEXT,
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Nunca apagar transações
CREATE OR REPLACE FUNCTION prevent_wallet_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Transações financeiras não podem ser apagadas';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER no_delete_wallet_transactions
BEFORE DELETE ON public.wallet_transactions
FOR EACH ROW EXECUTE FUNCTION prevent_wallet_transaction_delete();

-- ============================================
-- 4. REINOS
-- ============================================
CREATE TYPE kingdom_status AS ENUM ('protected', 'available', 'in_battle');

CREATE TABLE public.kingdoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  -- Posição no mapa (grid simples)
  map_x INTEGER NOT NULL,
  map_y INTEGER NOT NULL,
  -- Propriedade
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- Economia
  capital NUMERIC(12,2) DEFAULT 0,
  level INTEGER DEFAULT 1,
  -- Estado
  status kingdom_status DEFAULT 'available',
  protected_until TIMESTAMPTZ,
  -- Ranking / importância
  bounty_potential NUMERIC(10,2) DEFAULT 0.50,
  times_conquered INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kingdoms_owner ON public.kingdoms(owner_id);
CREATE INDEX idx_kingdoms_status ON public.kingdoms(status);

-- ============================================
-- 5. PEÇAS / INVENTÁRIO
-- ============================================
CREATE TYPE piece_type AS ENUM ('normal', 'premium', 'special');

CREATE TABLE public.piece_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  type piece_type DEFAULT 'normal',
  -- Atributos (futuro: mais resistência, etc.)
  max_health INTEGER DEFAULT 1,
  special_ability TEXT,
  is_cosmetic BOOLEAN DEFAULT FALSE,
  shop_price NUMERIC(10,2),
  is_available_in_shop BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.player_pieces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.piece_templates(id),
  -- Estado
  is_alive BOOLEAN DEFAULT TRUE,
  health INTEGER DEFAULT 1,
  -- Origem
  origin TEXT DEFAULT 'purchased' CHECK (origin IN ('purchased', 'free_recovery', 'initial', 'reward')),
  acquired_at TIMESTAMPTZ DEFAULT NOW(),
  destroyed_at TIMESTAMPTZ,
  destroyed_in_match_id UUID
);

CREATE INDEX idx_player_pieces_user ON public.player_pieces(user_id);
CREATE INDEX idx_player_pieces_alive ON public.player_pieces(user_id, is_alive);

-- ============================================
-- 6. PARTIDAS (MATCHES)
-- ============================================
CREATE TYPE match_status AS ENUM ('pending', 'active', 'finished', 'cancelled', 'abandoned');
CREATE TYPE match_type AS ENUM ('vs_computer', 'vs_player', 'tournament');

CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kingdom_id UUID REFERENCES public.kingdoms(id),
  match_type match_type NOT NULL DEFAULT 'vs_computer',
  status match_status DEFAULT 'pending',
  -- Jogadores
  challenger_id UUID NOT NULL REFERENCES public.profiles(id),
  defender_id UUID REFERENCES public.profiles(id), -- null se vs computer
  -- Resultado
  winner_id UUID REFERENCES public.profiles(id),
  -- Tabuleiro (estado serializado)
  board_state JSONB DEFAULT '[]',
  current_turn UUID, -- quem joga agora
  move_history JSONB DEFAULT '[]',
  -- Peças usadas
  challenger_pieces JSONB DEFAULT '[]',
  defender_pieces JSONB DEFAULT '[]',
  -- Timestamps
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_matches_challenger ON public.matches(challenger_id);
CREATE INDEX idx_matches_status ON public.matches(status);

-- ============================================
-- 7. LOJA (produtos oficiais)
-- ============================================
CREATE TYPE shop_category AS ENUM (
  'pieces',
  'protection',
  'training',
  'cosmetics',
  'season_pass'
);

CREATE TABLE public.shop_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category shop_category NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  -- Conteúdo
  piece_quantity INTEGER DEFAULT 0,
  duration_hours INTEGER, -- para escudos
  effect_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.shop_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id UUID NOT NULL REFERENCES public.shop_products(id),
  quantity INTEGER DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL,
  transaction_id UUID REFERENCES public.wallet_transactions(id),
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. MARKETPLACE (versão limitada - cosméticos)
-- ============================================
CREATE TABLE public.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  product_type TEXT NOT NULL, -- 'cosmetic_flag', 'piece_skin', etc.
  item_id UUID, -- referência ao item
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
  buyer_id UUID REFERENCES public.profiles(id),
  sold_at TIMESTAMPTZ,
  commission_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. RANKING (materializado para performance)
-- ============================================
CREATE TABLE public.rankings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  conquest_rank INTEGER,
  competitive_rank INTEGER,
  activity_rank INTEGER,
  conquest_score INTEGER DEFAULT 0,
  competitive_score INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. FUNÇÕES ÚTEIS
-- ============================================

-- Criar perfil + carteira automaticamente no registo
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Jogador')
  );
  
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER kingdoms_updated_at BEFORE UPDATE ON public.kingdoms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 11. RLS (Row Level Security) - básico
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kingdoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rankings ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (leitura pública de reinos e ranking, escrita só do próprio)
CREATE POLICY "Perfis públicos para leitura" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Utilizador edita o próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Carteira só do próprio" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Reinos públicos" ON public.kingdoms FOR SELECT USING (true);

CREATE POLICY "Peças só do próprio" ON public.player_pieces FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Produtos da loja públicos" ON public.shop_products FOR SELECT USING (is_active = true);

CREATE POLICY "Ranking público" ON public.rankings FOR SELECT USING (true);

-- ============================================
-- 12. DADOS INICIAIS (seed)
-- ============================================

-- Peças básicas
INSERT INTO public.piece_templates (name, description, type, shop_price, is_available_in_shop) VALUES
('Peça Normal', 'Peça padrão de damas', 'normal', 50, true),
('Peça Premium', 'Peça com aparência especial', 'premium', 150, true);

-- Produtos da loja (conforme documento)
INSERT INTO public.shop_products (name, description, category, price, piece_quantity, sort_order) VALUES
('Peça individual', '1 peça para o teu exército', 'pieces', 50, 1, 1),
('Pacote pequeno', '6 peças', 'pieces', 250, 6, 2),
('Pacote médio', '12 peças', 'pieces', 450, 12, 3),
('Pacote grande', '24 peças', 'pieces', 850, 24, 4),
('Reposição de exército', '12 peças para repor o teu exército', 'pieces', 450, 12, 5);

INSERT INTO public.shop_products (name, description, category, price, duration_hours, sort_order) VALUES
('Escudo de 1 hora', 'Bloqueia novos desafios durante 1 hora', 'protection', 100, 1, 10),
('Escudo de 24 horas', 'Bloqueia novos desafios durante 24 horas', 'protection', 500, 24, 11),
('Escudo de 7 dias', 'Bloqueia novos desafios durante 7 dias', 'protection', 2000, 168, 12),
('Bilhete de revanche', 'Permite solicitar uma revanche', 'protection', 100, NULL, 13);

INSERT INTO public.shop_products (name, description, category, price, sort_order) VALUES
('Bandeira personalizada', 'Bandeira única para o teu reino', 'cosmetics', 200, 20),
('Aparência especial das peças', 'Skin especial para as tuas peças', 'cosmetics', 300, 21),
('Tabuleiro temático', 'Tabuleiro com visual diferente', 'cosmetics', 500, 22),
('Coroa de prata', 'Título visual de prestígio', 'cosmetics', 500, 23),
('Coroa de ouro', 'Título visual de alto prestígio', 'cosmetics', 1000, 24),
('Castelo personalizado', 'Visual especial do teu castelo', 'cosmetics', 1500, 25);

-- Alguns reinos iniciais (mapa 5x5 para começar)
INSERT INTO public.kingdoms (name, slug, map_x, map_y, capital, level, bounty_potential, status) VALUES
('Reino do Norte', 'reino-do-norte', 0, 0, 500, 1, 0.50, 'available'),
('Reino do Sul', 'reino-do-sul', 0, 4, 500, 1, 0.50, 'available'),
('Reino do Leste', 'reino-do-leste', 4, 2, 500, 1, 0.50, 'available'),
('Reino do Oeste', 'reino-do-oeste', 0, 2, 500, 1, 0.50, 'available'),
('Reino Central', 'reino-central', 2, 2, 800, 2, 1.00, 'available'),
('Fortaleza de Ferro', 'fortaleza-de-ferro', 1, 1, 600, 1, 0.75, 'available'),
('Terras Verdes', 'terras-verdes', 3, 1, 500, 1, 0.50, 'available'),
('Deserto de Areia', 'deserto-de-areia', 1, 3, 500, 1, 0.50, 'available'),
('Montanhas Altas', 'montanhas-altas', 3, 3, 700, 2, 0.90, 'available'),
('Vale do Rio', 'vale-do-rio', 2, 0, 500, 1, 0.50, 'available'),
('Costa Dourada', 'costa-dourada', 2, 4, 600, 1, 0.70, 'available'),
('Floresta Sombria', 'floresta-sombria', 4, 0, 550, 1, 0.60, 'available'),
('Planície Aberta', 'planicie-aberta', 4, 4, 500, 1, 0.50, 'available'),
('Colinas do Vento', 'colinas-do-vento', 0, 1, 500, 1, 0.50, 'available'),
('Pântano Negro', 'pantano-negro', 1, 2, 450, 1, 0.40, 'available'),
('Ilha Perdida', 'ilha-perdida', 3, 0, 900, 2, 1.50, 'available'),
('Cidadela Real', 'cidadela-real', 2, 1, 1200, 3, 2.00, 'available'),
('Torre do Dragão', 'torre-do-dragao', 3, 2, 1000, 3, 1.80, 'available'),
('Porto Livre', 'porto-livre', 4, 3, 650, 1, 0.80, 'available'),
('Ruínas Antigas', 'ruinas-antigas', 1, 0, 700, 2, 1.00, 'available');
