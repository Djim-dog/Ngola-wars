# Ngola War — Deploy so no Cloudflare (sem computador)

Nao precisas de npm no telemovel. O Cloudflare faz o build.

## Passo 1 — GitHub (browser do telemovel)

1. Abre github.com → New repository → nome: `ngola-war` (Public)
2. Upload files → seleciona TODOS os ficheiros e pastas deste projeto
   (src, public, supabase, package.json, next.config.ts, etc.)
3. Commit

## Passo 2 — Cloudflare Pages

1. dash.cloudflare.com → Workers & Pages → Create → Pages
2. Connect to Git → autoriza GitHub → escolhe `ngola-war`
3. Configuracao de build:

| Campo | Valor |
|-------|--------|
| Framework preset | Next.js (Static HTML Export) |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | `/` (vazio) |

4. Environment variables → Add:

| Nome | Valor |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://grnrjdldbzlfhatzvghv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | a tua publishable key |
| `NODE_VERSION` | `20` |

5. Save and Deploy

Espera 2–5 minutos. O Cloudflare corre `npm install` e `npm run build` na cloud.

## Passo 3 — Supabase (SQL restante)

No SQL Editor, cola e corre o ficheiro `supabase/SQL_RESTANTE.sql` se ainda nao o fizeste.

## Passo 4 — Testar no telemovel

Abre o URL `*.pages.dev` → Registar → Primeira batalha → Mapa → Admin.

## Conta admin

Login com o user UID `174a8d75-9353-4559-b9af-97f4b1f5676e` → `/admin/`
