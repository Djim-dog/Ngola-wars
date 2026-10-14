-- ===== PARTE 10a/10 — Dados iniciais: peças e loja =====

INSERT INTO public.piece_templates (name, description, type, shop_price, is_available_in_shop)
VALUES
  ('Peca Normal', 'Peca padrao de damas', 'normal', 50, true),
  ('Peca Premium', 'Peca com aparencia especial', 'premium', 150, true)
ON CONFLICT DO NOTHING;

INSERT INTO public.shop_products (name, description, category, price, piece_quantity, sort_order)
VALUES
  ('Peca individual', '1 peca para o teu exercito', 'pieces', 50, 1, 1),
  ('Pacote pequeno', '6 pecas', 'pieces', 250, 6, 2),
  ('Pacote medio', '12 pecas', 'pieces', 450, 12, 3),
  ('Pacote grande', '24 pecas', 'pieces', 850, 24, 4),
  ('Reposicao de exercito', '12 pecas para repor', 'pieces', 450, 12, 5)
ON CONFLICT DO NOTHING;

INSERT INTO public.shop_products (name, description, category, price, duration_hours, sort_order)
VALUES
  ('Escudo de 1 hora', 'Bloqueia desafios 1 hora', 'protection', 100, 1, 10),
  ('Escudo de 24 horas', 'Bloqueia desafios 24 horas', 'protection', 500, 24, 11),
  ('Escudo de 7 dias', 'Bloqueia desafios 7 dias', 'protection', 2000, 168, 12),
  ('Bilhete de revanche', 'Permite solicitar revanche', 'protection', 100, NULL, 13)
ON CONFLICT DO NOTHING;

INSERT INTO public.shop_products (name, description, category, price, sort_order)
VALUES
  ('Bandeira personalizada', 'Bandeira unica', 'cosmetics', 200, 20),
  ('Aparencia especial das pecas', 'Skin especial', 'cosmetics', 300, 21),
  ('Tabuleiro tematico', 'Tabuleiro diferente', 'cosmetics', 500, 22),
  ('Coroa de prata', 'Titulo visual', 'cosmetics', 500, 23),
  ('Coroa de ouro', 'Titulo alto prestigio', 'cosmetics', 1000, 24),
  ('Castelo personalizado', 'Visual do castelo', 'cosmetics', 1500, 25)
ON CONFLICT DO NOTHING;
