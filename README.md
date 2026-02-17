# CRM GRAPYX - Prospecção

CRM multi-nicho com Next.js e Supabase.

## Setup

### 1. Banco de dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com)
2. Abra **SQL Editor** e execute o conteúdo de `supabase/setup_database.sql`
3. **Criar usuário admin** (uma das opções):

   **Opção A – Script automático:**
   - Adicione no `.env`: `SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key` (em Settings > API)
   - Execute: `npm run setup:admin`

   **Opção B – Manual:**
   - Em **Authentication** > **Users** > **Add user** crie:
   - Email: `graphyx.ai@gmail.com`
   - Password: `@101222Tlc`
   - Marque "Auto Confirm User"

### 2. Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 3. Executar

```bash
npm install
npm run dev
```

O app estará em http://localhost:3000 (Next.js)

## Funcionalidades

- **Login:** Credenciais fixas (graphyx.ai@gmail.com)
- **Dashboard:** KPIs e gráficos por status e nicho
- **Prospecção:** CRUD completo de clientes por nicho
- **MVP:** Nicho para sites custom-built
- **Sidebar:** Toggle para recolher/expandir
- **Tema:** Light/Dark mode (sessionStorage)
# CRM-Grapyhx
