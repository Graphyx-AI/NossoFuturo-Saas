-- ============================================
-- CRM GRAPYX - Setup Database
-- Execute no Supabase SQL Editor
-- ============================================

-- Extensão UUID (já habilitada por padrão no Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho TEXT NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  endereco TEXT,
  site TEXT,
  tem_site BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
    'novo', 'contatado', 'interessado', 'negociacao', 'fechado', 'recusado'
  )),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_nicho ON public.clientes(nicho);
CREATE INDEX IF NOT EXISTS idx_clientes_status ON public.clientes(status);
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON public.clientes(nome);
CREATE INDEX IF NOT EXISTS idx_clientes_created_at ON public.clientes(created_at);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clientes_updated_at ON public.clientes;
CREATE TRIGGER trigger_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- Políticas: apenas graphyx.ai@gmail.com pode acessar
DROP POLICY IF EXISTS "Admin pode ler clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados podem ler clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados podem inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados podem atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Usuarios autenticados podem deletar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode inserir clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode atualizar clientes" ON public.clientes;
DROP POLICY IF EXISTS "Admin pode deletar clientes" ON public.clientes;

CREATE POLICY "Admin pode ler clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

CREATE POLICY "Admin pode inserir clientes"
  ON public.clientes FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

CREATE POLICY "Admin pode atualizar clientes"
  ON public.clientes FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

CREATE POLICY "Admin pode deletar clientes"
  ON public.clientes FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'graphyx.ai@gmail.com');

-- Tabela auxiliar de nichos (opcional, para referência)
CREATE TABLE IF NOT EXISTS public.nichos (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL
);

INSERT INTO public.nichos (id, label) VALUES
  ('psicologo', 'Psicólogo'),
  ('imobiliaria', 'Imobiliária'),
  ('curso_online', 'Curso Online'),
  ('dentista', 'Dentista'),
  ('clinica_estetica', 'Clínica de Estética'),
  ('barbearia', 'Barbearia'),
  ('empresa_limpeza', 'Empresa de Limpeza'),
  ('coach', 'Coach'),
  ('turismo_excursao', 'Turismo e Excursão'),
  ('mvp', 'MVP')
ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label;
