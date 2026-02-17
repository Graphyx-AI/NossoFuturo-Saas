import { createClient } from '@supabase/supabase-js';

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key';

function readEnv(name, fallback) {
  const value = process.env[name];
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

const supabaseUrl = readEnv('NEXT_PUBLIC_SUPABASE_URL', FALLBACK_SUPABASE_URL);
const supabaseAnonKey = readEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', FALLBACK_SUPABASE_ANON_KEY);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
