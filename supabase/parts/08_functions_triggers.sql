-- ===== PARTE 8/10 — Funções e Triggers =====

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'player_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Jogador')
  );
  INSERT INTO public.wallets (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS wallets_updated_at ON public.wallets;
CREATE TRIGGER wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS kingdoms_updated_at ON public.kingdoms;
CREATE TRIGGER kingdoms_updated_at
  BEFORE UPDATE ON public.kingdoms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION prevent_wallet_transaction_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Transações financeiras não podem ser apagadas';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS no_delete_wallet_transactions ON public.wallet_transactions;
CREATE TRIGGER no_delete_wallet_transactions
  BEFORE DELETE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION prevent_wallet_transaction_delete();
