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
   - Email: `graphyx.ai@gmail.com`
   - Password: `@101222Tlc`
   - Marque "Auto Confirm User"

### 2. Variáveis de ambiente

Crie o arquivo `.env` na raiz do projeto e preencha:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 3. Importar CSV processado para Supabase

O script abaixo lê os CSVs da pasta `dados/` e insere/atualiza na tabela `public.clients`:

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
