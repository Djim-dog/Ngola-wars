-- ===== PARTE 9/10 — Segurança (RLS) =====

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

DROP POLICY IF EXISTS "Perfis publicos leitura" ON public.profiles;
CREATE POLICY "Perfis publicos leitura"
  ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Utilizador edita perfil" ON public.profiles;
CREATE POLICY "Utilizador edita perfil"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Carteira propria" ON public.wallets;
CREATE POLICY "Carteira propria"
  ON public.wallets FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Reinos publicos" ON public.kingdoms;
CREATE POLICY "Reinos publicos"
  ON public.kingdoms FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pecas proprias" ON public.player_pieces;
CREATE POLICY "Pecas proprias"
  ON public.player_pieces FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Produtos loja publicos" ON public.shop_products;
CREATE POLICY "Produtos loja publicos"
  ON public.shop_products FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Ranking publico" ON public.rankings;
CREATE POLICY "Ranking publico"
  ON public.rankings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Transacoes proprias" ON public.wallet_transactions;
CREATE POLICY "Transacoes proprias"
  ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Compras proprias" ON public.shop_purchases;
CREATE POLICY "Compras proprias"
  ON public.shop_purchases FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Partidas visiveis" ON public.matches;
CREATE POLICY "Partidas visiveis"
  ON public.matches FOR SELECT USING (
    auth.uid() = challenger_id OR auth.uid() = defender_id OR true
  );
