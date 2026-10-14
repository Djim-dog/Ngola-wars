# Deploy Ngola War no Cloudflare Pages (so telemovel / sem npm local)

## Opcao A — GitHub + Cloudflare (recomendado)

1. Cria repositorio no GitHub (pelo browser do telemovel)
2. Faz upload de TODOS os ficheiros deste ZIP (exceto node_modules)
3. No Cloudflare Dashboard:
   - Workers & Pages → Create → Pages → Connect to Git
   - Escolhe o repositorio
   - Build settings:
     - Framework preset: Next.js (Static HTML Export)
     - Build command: npm run build
     - Build output directory: out
     - Node version: 20 (Environment variables → NODE_VERSION = 20)
   - Environment variables (Production):
     - NEXT_PUBLIC_SUPABASE_URL = https://grnrjdldbzlfhatzvghv.supabase.co
     - NEXT_PUBLIC_SUPABASE_ANON_KEY = (a tua publishable key)
4. Save and Deploy
5. Cloudflare corre npm install + build na cloud — nao precisas de computador

## Opcao B — Vercel (mais simples com Next.js)

1. vercel.com → Add New Project
2. Import Git repository (mesmo do GitHub)
3. Framework: Next.js
4. Mesmas env vars
5. Deploy

## Apos o deploy

- Abre o URL no telemovel
- Testa: registo → primeira batalha → mapa → loja → admin
