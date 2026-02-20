# CRM GRAPYX - Prospecção

CRM multi-nicho com Next.js e Supabase.

## Setup

### 1. Banco de dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com).
2. Rode primeiro `supabase/setup_database.sql` (legado) se necessário.
3. Rode a migration `migrations/20260217110000_create_clients_table.sql` para criar a nova tabela canônica `public.clients`.
4. **Criar usuário admin** (uma das opções):

   **Opção A – Script automático:**
   - Adicione no `.env`: `SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key` (em Settings > API)
   - Execute: `npm run setup:admin`

   **Opção B – Manual:**
   - Em **Authentication** > **Users** > **Add user** crie:
   - Defina email e senha fortes específicos do ambiente
   - Marque "Auto Confirm User" somente quando necessário

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` na raiz do projeto (ou crie o `.env`) e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```


### 2.1 Troubleshooting (Supabase não configurado)

Se aparecer o erro **"Supabase não configurado"** (ao salvar, no login, etc.):

- **Local (localhost):** garanta que o `.env` (ou `.env.local`) está na **raiz do projeto** (mesma pasta do `package.json`), com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` definidos. Depois de criar ou editar o arquivo, **reinicie** o servidor (`Ctrl+C` e `npm run dev` de novo). Se usar `next build` + `next start`, rode `next build` novamente após ajustar o `.env`.
- **Vercel (deploy):** o `.env` do seu PC não é usado na Vercel. Configure as variáveis em **Vercel** → projeto → **Settings** → **Environment Variables** (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`) e faça um **Redeploy**.

Dicas adicionais para desenvolvimento local:

- Use como modelo o arquivo `.env.example` (copie para `.env` e preencha os valores).
- Garanta que as chaves estejam em `.env.local` (ou `.env`) com os nomes exatos `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ou `NEXT_PUBLIC_SUPABASE_KEY`).
- No Windows/PowerShell, confirme que o arquivo está na raiz e sem extensão oculta (`.txt`).
- Este projeto também aceita aliases: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`.

### 3. Importar CSV processado para Supabase

> Importante: ao abrir as páginas de prospecção, o app tenta sincronizar automaticamente os CSVs da pasta `dados/` para `public.clients` (upsert por `niche,name,raw_csv_path`).
> Se quiser forçar/reprocessar a carga completa, execute o script abaixo.

O script lê os CSVs da pasta `dados/` e insere/atualiza em `public.clients` (com fallback automático para `public.clientes`):

```bash
pip install supabase
SUPABASE_URL=https://seu-projeto.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key \
python scripts/import_csv_to_supabase.py
```

### 4. Executar app

```bash
npm install
npm run dev
```

O app estará em http://localhost:3000.

## Funcionalidades

- Dashboard com dados do Supabase
- Prospecção por nicho com CRUD de clientes
- Delete remove do UI e do Supabase

## Resolver conflito de merge em `lib/clientes.js`

Se aparecer conflito entre as versões `main` (somente `clients`) e `codex/...` (suporte híbrido), mantenha a versão híbrida enquanto existir dado em `public.clientes`.

```bash
git checkout --theirs lib/clientes.js  # se "theirs" for a branch codex com suporte híbrido
# ou abra o arquivo e remova todos os marcadores <<<<<<< ======= >>>>>>>
git add lib/clientes.js
git commit -m "Resolve merge conflict in clientes data access"
```

A versão correta para ambiente híbrido deve:
- ler de `clients` e `clientes`
- normalizar campos (`name` -> `nome`, `phone` -> `telefone`, etc.)
- deduplicar por chave de negócio (nicho+nome+telefone+endereço)
- deletar em ambas tabelas


> Observação: o app agora tenta **inserir/atualizar primeiro em `public.clients`** e, se a tabela canônica não existir no projeto, faz fallback automático para `public.clientes`.


## Segurança e SaaS readiness

### Multi-tenant
- Rode também a migration `migrations/20260220120000_multitenancy_billing.sql`.
- Ela adiciona `tenants`, `tenant_memberships`, `user_profiles` e `tenant_id` em `public.clients`.
- As políticas RLS passam a ser por membership (owner/admin/member), não por e-mail fixo.

### Proteção de rotas
- O projeto agora possui `middleware.js` para bloquear dashboard sem sessão e redirecionar para `/login`.

### Billing (Stripe)
- Endpoints prontos:
  - `POST /api/billing/checkout`
  - `POST /api/billing/portal`
  - `POST /api/billing/webhook`
- Variáveis necessárias:

```bash
NEXT_PUBLIC_APP_URL=https://seu-dominio.com
STRIPE_SECRET_KEY=sk_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

> O webhook já está engatilhado para receber eventos; falta somente implementar suas regras de negócio (ex.: ativar/desativar features por plano).
