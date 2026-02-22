# CRM GRAPYX - Prospeccao

CRM multi-nicho com Next.js e Supabase, com dois workspaces isolados:
- `graphyx`
- `lumyf`

## Setup

### 1. Banco de dados (Supabase)

1. Crie um projeto no Supabase.
2. Rode `supabase/setup_database.sql` (legado) se necessario.
3. Rode as migrations em `migrations/`.
4. Crie os admins (script automatico recomendado).

### 2. Variaveis de ambiente

Crie `.env` na raiz:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Admins e workspaces
NEXT_PUBLIC_GRAPHYX_ADMIN_EMAIL=graphyx.ai@gmail.com
NEXT_PUBLIC_LUMYF_ADMIN_EMAIL=lumyf@gmail.com
GRAPHYX_ADMIN_PASSWORD=sua-senha-graphyx
LUMYF_ADMIN_PASSWORD=sua-senha-lumyf
```

### 3. Criar usuarios admin

```bash
npm run setup:admin
```

O script cria (ou ignora se ja existir) os dois admins:
- admin Graphyx (`workspace: graphyx`)
- admin Lumyf (`workspace: lumyf`)

### 4. Rodar o app

```bash
npm install
npm run dev
```

App em `http://localhost:3000`.

## Testes

```bash
npm run test:unit
npm run test:e2e
```

Os testes E2E sobem o Next em modo mock (`NEXT_PUBLIC_E2E_MOCK=1`), sem depender de Supabase real.

## Funcionalidades

- Login com separacao de workspace por admin
- Dashboard diferente por projeto (Graphyx x Lumyf)
- CRUD de clientes com isolamento por workspace no banco (RLS)
- Prospecao por nicho com contadores por workspace
