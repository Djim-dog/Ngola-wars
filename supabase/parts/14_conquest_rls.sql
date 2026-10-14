-- Permitir conquista de reinos (update owner) por jogadores autenticados
DROP POLICY IF EXISTS "Atualizar reinos conquista" ON public.kingdoms;
CREATE POLICY "Atualizar reinos conquista"
  ON public.kingdoms FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Permitir update de profiles (stats) pelo proprio
DROP POLICY IF EXISTS "Utilizador edita perfil" ON public.profiles;
CREATE POLICY "Utilizador edita perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
