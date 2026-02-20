import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

const PLACEHOLDER_URL = 'https://seu-projeto.supabase.co';
const PLACEHOLDER_ANON = 'sua-anon-key';

function readRawEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return '';
}

const rawSupabaseUrl = readRawEnv(
  'NEXT_PUBLIC_SUPABASE_URL',
  'VITE_SUPABASE_URL',
  'SUPABASE_URL'
);

const rawSupabaseAnonKey = readRawEnv(
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_SUPABASE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_ANON_KEY'
);

const isPlaceholder = (url, key) =>
  !url || !key ||
  url === PLACEHOLDER_URL || key === PLACEHOLDER_ANON ||
  url === FALLBACK_SUPABASE_URL || key === FALLBACK_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl && rawSupabaseAnonKey && !isPlaceholder(rawSupabaseUrl, rawSupabaseAnonKey)
);

export function getSupabaseConfigErrorMessage() {
  const hasUrl = Boolean(rawSupabaseUrl && rawSupabaseUrl !== PLACEHOLDER_URL && rawSupabaseUrl !== FALLBACK_SUPABASE_URL);
  const hasKey = Boolean(rawSupabaseAnonKey && rawSupabaseAnonKey !== PLACEHOLDER_ANON && rawSupabaseAnonKey !== FALLBACK_SUPABASE_ANON_KEY);
  const parts = [];
  if (!hasUrl) parts.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!hasKey) parts.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const missing = parts.length ? parts.join(' e ') : 'variáveis';
  return `Supabase não configurado: ${parts.length ? missing + ' não definida(s) ou inválida(s).' : 'verifique as chaves.'} Se o .env está correto, reinicie o servidor (npm run dev) e recarregue a página.`;
}

const supabaseUrl = rawSupabaseUrl || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = rawSupabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
