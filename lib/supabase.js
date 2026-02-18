import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

function readRawEnv(name) {
  const value = process.env[name];
  if (typeof value !== 'string') return '';
  return value.trim();
}

const rawSupabaseUrl = readRawEnv('NEXT_PUBLIC_SUPABASE_URL');
const rawSupabaseAnonKey = readRawEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(rawSupabaseUrl && rawSupabaseAnonKey);

export function getSupabaseConfigErrorMessage() {
  return 'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.';
}

const supabaseUrl = rawSupabaseUrl || FALLBACK_SUPABASE_URL;
const supabaseAnonKey = rawSupabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
