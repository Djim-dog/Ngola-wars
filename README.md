# ♟️👑 KINGDOM CHECKERS

Jogo de damas com conquista de reinos, economia virtual e possibilidade futura de recompensas reais.

## Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind
- **Backend**: Supabase (Auth + PostgreSQL + Realtime)
- **Deploy**: Cloudflare Pages (recomendado)

## Estrutura

```
src/
  app/               # Rotas Next.js
  components/        # Componentes UI
  lib/
    checkers-engine.ts   # Motor de damas (validação de movimentos)
    supabase/            # Clientes Supabase
  types/             # TypeScript types
supabase/
  schema.sql         # Schema completo da base de dados
```

## Como começar

1. Cria um projeto no [Supabase](https://supabase.com)
2. Corre o ficheiro `supabase/schema.sql` no SQL Editor
3. Copia `.env.example` para `.env.local` e preenche as chaves
4. Instala dependências:
   ```bash
   npm install
   npm install @supabase/supabase-js @supabase/ssr
   ```
5. Corre em desenvolvimento:
   ```bash
   npm run dev
   ```

## Fases de desenvolvimento

### Fase 1 — Jogo funcional (atual)
- [x] Schema da base de dados
- [x] Motor de damas
- [x] Landing page
- [ ] Autenticação
- [ ] Mapa de reinos
- [ ] Partidas vs computador
- [ ] Sistema de conquista
- [ ] Ranking básico

### Fase 2 — Loja e carteira
- [ ] Carteira (4 componentes)
- [ ] Loja oficial
- [ ] Inventário de peças
- [ ] Depósitos

### Fase 3 — Marketplace e recompensas
- [ ] Marketplace de cosméticos
- [ ] Recompensas reais
- [ ] Levantamentos

## Regras principais (V1.0)

- Entrada gratuita
- Primeira batalha vs computador
- Vitória inicial → 500 Kz de capital virtual
- Peças finitas (destruídas = perdidas)
- Capital mínimo 500 Kz para desafiar jogadores
- Carteira separada em: capital do reino / saldo de compras / recompensas / reservado

## Licença

Projeto privado — todos os direitos reservados.
