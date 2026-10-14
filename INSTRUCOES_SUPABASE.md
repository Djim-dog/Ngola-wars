# Configuração Supabase (telemóvel)

## 1. Aplicar o schema (obrigatório)

1. Abre o Supabase no browser do telemóvel:  
   https://supabase.com/dashboard/project/grnrjdldbzlfhatzvghv
2. No menu lateral → **SQL Editor**
3. Cria uma nova query
4. Abre o ficheiro `supabase/schema.sql` deste projeto (copia todo o conteúdo)
5. Cola no SQL Editor e carrega em **Run**

Isto cria:
- Tabelas (profiles, wallets, kingdoms, pieces, matches, shop, marketplace…)
- Triggers (perfil + carteira automáticos no registo)
- 20 reinos iniciais
- Produtos da loja
- Políticas de segurança (RLS)

## 2. Confirmação de email (opcional para testes)

Authentication → Providers → Email  
Podes desativar “Confirm email” temporariamente para testar mais rápido no telemóvel.

## 3. Utilizador admin

UID já criado: `174a8d75-9353-4559-b9af-97f4b1f5676e`

Depois de correres o schema, o trigger cria o perfil e a carteira automaticamente nos **novos** registos.  
Para o admin que já existe, podes correr no SQL Editor:

```sql
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
```

## 4. Chaves

- **Publishable / Anon** → usada no frontend (já está em `.env.local`)
- **Secret** → nunca colocar no código do browser nem em variáveis públicas do Cloudflare Pages

## 5. Deploy Cloudflare Pages

No painel do Cloudflare Pages, define as variáveis de ambiente:

```
NEXT_PUBLIC_SUPABASE_URL = https://grnrjdldbzlfhatzvghv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_H3dEbB5YNyo17TfoyKfxjw_0k1f9D3p
```

Framework preset: Next.js  
Build command: `npm run build`  
Output: `.next` (ou o que o adaptador Cloudflare indicar)

Para Cloudflare Pages + Next.js recomenda-se `@cloudflare/next-on-pages` ou o adaptador oficial quando fores fazer o deploy.
