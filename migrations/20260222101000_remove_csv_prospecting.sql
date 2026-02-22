-- Remove CSV-specific persistence from clients tables (manual-only workflow)

DROP INDEX IF EXISTS idx_clients_workspace_niche_name_raw_csv_unique;
DROP INDEX IF EXISTS idx_clientes_workspace_nicho_nome_raw_csv_unique;
DROP INDEX IF EXISTS idx_clients_niche_name_raw_csv_unique;

ALTER TABLE public.clients
  DROP COLUMN IF EXISTS raw_csv_path;

ALTER TABLE public.clientes
  DROP COLUMN IF EXISTS raw_csv_path;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_workspace_niche_name_unique
  ON public.clients (workspace, niche, name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_workspace_nicho_nome_unique
  ON public.clientes (workspace, nicho, nome);
