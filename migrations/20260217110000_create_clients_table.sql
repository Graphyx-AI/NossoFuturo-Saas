-- Create canonical clients table for CSV ingestion and niche pages
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'client_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.client_status AS ENUM (
      'novo',
      'contatado',
      'interessado',
      'negociacao',
      'fechado',
      'recusado'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  niche TEXT NOT NULL,
  raw_csv_path TEXT,
  phone TEXT,
  address TEXT,
  website TEXT,
  has_website BOOLEAN NOT NULL DEFAULT FALSE,
  status public.client_status NOT NULL DEFAULT 'novo',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_niche ON public.clients (niche);
CREATE INDEX IF NOT EXISTS idx_clients_niche_created_at ON public.clients (niche, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clients_status ON public.clients (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_niche_name_raw_csv_unique
  ON public.clients (niche, name, raw_csv_path);

CREATE OR REPLACE FUNCTION public.update_clients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clients_updated_at ON public.clients;
CREATE TRIGGER trigger_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_clients_updated_at();

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can read clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can delete clients" ON public.clients;

CREATE POLICY "Admin can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

CREATE POLICY "Admin can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

CREATE POLICY "Admin can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

CREATE POLICY "Admin can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

-- Optional backfill from legacy table when it exists.
INSERT INTO public.clients (id, name, niche, phone, address, website, has_website, status, notes, created_at, updated_at)
SELECT
  c.id,
  c.nome,
  c.nicho,
  c.telefone,
  c.endereco,
  c.site,
  COALESCE(c.tem_site, FALSE),
  c.status::public.client_status,
  c.observacoes,
  COALESCE(c.created_at, now()),
  COALESCE(c.updated_at, now())
FROM public.clientes c
WHERE NOT EXISTS (SELECT 1 FROM public.clients n WHERE n.id = c.id)
ON CONFLICT (id) DO NOTHING;
