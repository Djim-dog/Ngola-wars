-- Cole no SQL Editor do Supabase se ainda nao correste
-- 1) Conquista de reinos
DROP POLICY IF EXISTS "Atualizar reinos conquista" ON public.kingdoms;
CREATE POLICY "Atualizar reinos conquista"
  ON public.kingdoms FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Utilizador edita perfil" ON public.profiles;
CREATE POLICY "Utilizador edita perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 2) Escrita carteira / loja (se ainda nao)
DROP POLICY IF EXISTS "Carteira update propria" ON public.wallets;
CREATE POLICY "Carteira update propria"
  ON public.wallets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Inserir transacoes proprias" ON public.wallet_transactions;
CREATE POLICY "Inserir transacoes proprias"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Inserir compras proprias" ON public.shop_purchases;
CREATE POLICY "Inserir compras proprias"
  ON public.shop_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Inserir pecas proprias" ON public.player_pieces;
CREATE POLICY "Inserir pecas proprias"
  ON public.player_pieces FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Update pecas proprias" ON public.player_pieces;
CREATE POLICY "Update pecas proprias"
  ON public.player_pieces FOR UPDATE
  USING (auth.uid() = user_id);
