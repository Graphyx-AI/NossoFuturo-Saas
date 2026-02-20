# Nosso Futuro - SaaS (Financas Pessoais)

App de financas pessoais multi-tenant com Next.js 14 e Supabase.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase: Auth (GoTrue), Postgres com RLS, Realtime

## Setup

### 1. Banco de dados (Supabase)

1. Crie um projeto no Supabase.
2. No SQL Editor, rode `supabase/setup-database.sql`.
3. Aplique as migrations em `supabase/migrations` (incluindo `20260220010000_auth_bootstrap_and_backfill.sql`).

### 2. Variaveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`

Importante:
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` deve ser a chave publica `anon`.
- Nunca use `service_role` em variaveis `NEXT_PUBLIC_*`.

### 3. Instalacao e execucao

```bash
npm install
npm run dev
```

## Testes

```bash
npm run test
npm run build
```

## Seguranca

- Nunca versione segredos reais em `.env.example`.
- Rode scanner local:

```bash
npm run security:scan
```
