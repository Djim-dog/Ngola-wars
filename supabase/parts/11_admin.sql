-- ===== PARTE EXTRA — Admin (o teu user ja existente) =====

INSERT INTO public.profiles (id, username, display_name)
VALUES (
  '174a8d75-9353-4559-b9af-97f4b1f5676e',
  'admin',
  'Admin'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.wallets (user_id)
VALUES ('174a8d75-9353-4559-b9af-97f4b1f5676e')
ON CONFLICT (user_id) DO NOTHING;
