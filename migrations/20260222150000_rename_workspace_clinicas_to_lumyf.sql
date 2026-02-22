-- Rename legacy workspace id "clinicas" to "lumyf"

DO $$
DECLARE
  table_ref RECORD;
BEGIN
  FOR table_ref IN
    SELECT c.table_schema, c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'workspace'
  LOOP
    EXECUTE format(
      'UPDATE %I.%I SET workspace = ''lumyf'' WHERE workspace = ''clinicas''',
      table_ref.table_schema,
      table_ref.table_name
    );
  END LOOP;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.workspaces') IS NOT NULL THEN
    INSERT INTO public.workspaces (id, name)
    VALUES ('lumyf', 'Lumyf')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

    DELETE FROM public.workspaces
    WHERE id = 'clinicas';
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regclass('public.workspace_admins') IS NOT NULL THEN
    UPDATE public.workspace_admins
    SET workspace = 'lumyf'
    WHERE workspace = 'clinicas';

    UPDATE public.workspace_admins
    SET email = 'lumyf@gmail.com'
    WHERE lower(email) = 'admin.clinicas@gmail.com';
  END IF;
END
$$;

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
