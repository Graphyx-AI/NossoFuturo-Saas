-- Add workspace isolation for multi-admin CRM setup

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS workspace TEXT NOT NULL DEFAULT 'graphyx';

ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS workspace TEXT NOT NULL DEFAULT 'graphyx';

UPDATE public.clients
SET workspace = 'graphyx'
WHERE workspace IS NULL OR btrim(workspace) = '';

UPDATE public.clientes
SET workspace = 'graphyx'
WHERE workspace IS NULL OR btrim(workspace) = '';

CREATE INDEX IF NOT EXISTS idx_clients_workspace ON public.clients (workspace);
CREATE INDEX IF NOT EXISTS idx_clients_workspace_niche ON public.clients (workspace, niche);
CREATE INDEX IF NOT EXISTS idx_clientes_workspace ON public.clientes (workspace);
CREATE INDEX IF NOT EXISTS idx_clientes_workspace_nicho ON public.clientes (workspace, nicho);

DROP INDEX IF EXISTS idx_clients_niche_name_raw_csv_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_workspace_niche_name_raw_csv_unique
  ON public.clients (workspace, niche, name, raw_csv_path);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_workspace_nicho_nome_raw_csv_unique
  ON public.clientes (workspace, nicho, nome, raw_csv_path);

CREATE OR REPLACE FUNCTION public.current_workspace_from_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT CASE lower(auth.jwt() ->> 'email')
    WHEN 'graphyx.ai@gmail.com' THEN 'graphyx'
    WHEN 'lumyf@gmail.com' THEN 'lumyf'
    ELSE NULL
  END
$$;

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace clients read" ON public.clients;
DROP POLICY IF EXISTS "Workspace clients insert" ON public.clients;
DROP POLICY IF EXISTS "Workspace clients update" ON public.clients;
DROP POLICY IF EXISTS "Workspace clients delete" ON public.clients;

CREATE POLICY "Workspace clients read"
  ON public.clients FOR SELECT
  TO authenticated
  USING (workspace = public.current_workspace_from_email());

CREATE POLICY "Workspace clients insert"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (workspace = public.current_workspace_from_email());

CREATE POLICY "Workspace clients update"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (workspace = public.current_workspace_from_email())
  WITH CHECK (workspace = public.current_workspace_from_email());

CREATE POLICY "Workspace clients delete"
  ON public.clients FOR DELETE
  TO authenticated
  USING (workspace = public.current_workspace_from_email());

DROP POLICY IF EXISTS "Workspace clientes read" ON public.clientes;
DROP POLICY IF EXISTS "Workspace clientes insert" ON public.clientes;
DROP POLICY IF EXISTS "Workspace clientes update" ON public.clientes;
DROP POLICY IF EXISTS "Workspace clientes delete" ON public.clientes;

CREATE POLICY "Workspace clientes read"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (workspace = public.current_workspace_from_email());

CREATE POLICY "Workspace clientes insert"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (workspace = public.current_workspace_from_email());

CREATE POLICY "Workspace clientes update"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (workspace = public.current_workspace_from_email())
  WITH CHECK (workspace = public.current_workspace_from_email());

CREATE POLICY "Workspace clientes delete"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (workspace = public.current_workspace_from_email());
