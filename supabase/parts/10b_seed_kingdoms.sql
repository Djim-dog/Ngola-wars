-- ===== PARTE 10b/10 — Dados iniciais: 20 reinos =====

INSERT INTO public.kingdoms (name, slug, map_x, map_y, capital, level, bounty_potential, status)
VALUES
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
  ('Planicie Aberta', 'planicie-aberta', 4, 4, 500, 1, 0.50, 'available'),
  ('Colinas do Vento', 'colinas-do-vento', 0, 1, 500, 1, 0.50, 'available'),
  ('Pantano Negro', 'pantano-negro', 1, 2, 450, 1, 0.40, 'available'),
  ('Ilha Perdida', 'ilha-perdida', 3, 0, 900, 2, 1.50, 'available'),
  ('Cidadela Real', 'cidadela-real', 2, 1, 1200, 3, 2.00, 'available'),
  ('Torre do Dragao', 'torre-do-dragao', 3, 2, 1000, 3, 1.80, 'available'),
  ('Porto Livre', 'porto-livre', 4, 3, 650, 1, 0.80, 'available'),
  ('Ruinas Antigas', 'ruinas-antigas', 1, 0, 700, 2, 1.00, 'available')
ON CONFLICT (slug) DO NOTHING;
