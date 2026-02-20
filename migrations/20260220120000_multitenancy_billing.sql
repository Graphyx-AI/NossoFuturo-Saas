-- Multi-tenant base + billing hooks
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  billing_status TEXT NOT NULL DEFAULT 'inactive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  active_tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;

-- bootstrap default tenant for existing installs
INSERT INTO public.tenants (name, slug)
SELECT 'Default Workspace', 'default-workspace'
WHERE NOT EXISTS (SELECT 1 FROM public.tenants);

UPDATE public.clients
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE public.clientes
SET tenant_id = (SELECT id FROM public.tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

ALTER TABLE public.clients ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN tenant_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clients_tenant_id ON public.clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tenant_id ON public.clientes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_memberships_user_id ON public.tenant_memberships(user_id);

CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = target_tenant
      AND tm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(target_tenant UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_memberships tm
    WHERE tm.tenant_id = target_tenant
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner', 'admin')
  );
$$;

DROP POLICY IF EXISTS "Admin can read clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can insert clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can update clients" ON public.clients;
DROP POLICY IF EXISTS "Admin can delete clients" ON public.clients;

CREATE POLICY "Tenant members can read clients"
  ON public.clients FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Tenant admins can insert clients"
  ON public.clients FOR INSERT
  TO authenticated
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can update clients"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can delete clients"
  ON public.clients FOR DELETE
  TO authenticated
  USING (public.is_tenant_admin(tenant_id));

DROP POLICY IF EXISTS "Admin pode ler clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode deletar clientes" ON public.clientes;

CREATE POLICY "Tenant members can read clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY "Tenant admins can insert clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can update clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (public.is_tenant_admin(tenant_id))
  WITH CHECK (public.is_tenant_admin(tenant_id));

CREATE POLICY "Tenant admins can delete clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (public.is_tenant_admin(tenant_id));

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their memberships" ON public.tenant_memberships;
CREATE POLICY "Users can read their memberships"
  ON public.tenant_memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user_bootstrap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  created_tenant_id UUID;
BEGIN
  INSERT INTO public.tenants (name, slug)
  VALUES (COALESCE(NULLIF(NEW.raw_user_meta_data->>'company_name', ''), split_part(NEW.email, '@', 1) || ' workspace'), NULL)
  RETURNING id INTO created_tenant_id;

  INSERT INTO public.tenant_memberships (tenant_id, user_id, role)
  VALUES (created_tenant_id, NEW.id, 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.user_profiles (id, active_tenant_id)
  VALUES (NEW.id, created_tenant_id)
  ON CONFLICT (id) DO UPDATE SET active_tenant_id = EXCLUDED.active_tenant_id, updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap ON auth.users;
CREATE TRIGGER on_auth_user_created_bootstrap
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_bootstrap();
