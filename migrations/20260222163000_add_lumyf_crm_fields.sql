-- Add Lumyf CRM fields for richer lead and customer management

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'client_status' AND n.nspname = 'public'
  ) THEN
    ALTER TYPE public.client_status ADD VALUE IF NOT EXISTS 'testando';
    ALTER TYPE public.client_status ADD VALUE IF NOT EXISTS 'cliente';
    ALTER TYPE public.client_status ADD VALUE IF NOT EXISTS 'perdido';
  END IF;
END
$$;

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS company TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS how_heard_about_us TEXT,
  ADD COLUMN IF NOT EXISTS plan_interest TEXT,
  ADD COLUMN IF NOT EXISTS potential_value NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS first_contact_date DATE,
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS close_probability INTEGER CHECK (close_probability >= 0 AND close_probability <= 100),
  ADD COLUMN IF NOT EXISTS user_type TEXT,
  ADD COLUMN IF NOT EXISTS main_financial_pain TEXT,
  ADD COLUMN IF NOT EXISTS uses_spreadsheet_or_app BOOLEAN,
  ADD COLUMN IF NOT EXISTS user_count INTEGER CHECK (user_count >= 0),
  ADD COLUMN IF NOT EXISTS needs_shared_workspace BOOLEAN,
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contact_channel TEXT,
  ADD COLUMN IF NOT EXISTS conversation_notes TEXT,
  ADD COLUMN IF NOT EXISTS created_account BOOLEAN,
  ADD COLUMN IF NOT EXISTS signup_date DATE,
  ADD COLUMN IF NOT EXISTS is_trial BOOLEAN,
  ADD COLUMN IF NOT EXISTS current_plan TEXT,
  ADD COLUMN IF NOT EXISTS renewal_date DATE,
  ADD COLUMN IF NOT EXISTS is_canceled BOOLEAN,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS lead_source TEXT,
  ADD COLUMN IF NOT EXISTS campaign TEXT,
  ADD COLUMN IF NOT EXISTS affiliate TEXT;

CREATE INDEX IF NOT EXISTS idx_clients_workspace_lead_source ON public.clients (workspace, lead_source);
CREATE INDEX IF NOT EXISTS idx_clients_workspace_next_followup ON public.clients (workspace, next_followup_at);
