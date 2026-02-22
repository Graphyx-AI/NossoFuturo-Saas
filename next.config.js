import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function readDotEnvValue(name) {
  const envPath = resolve(process.cwd(), '.env');
  if (!existsSync(envPath)) return '';

  const content = readFileSync(envPath, 'utf-8').replace(/^\uFEFF/, '');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^([^=\s]+)\s*=\s*(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    if (key === name) return value;
  }

  return '';
}

const dotEnvSupabaseUrl =
  readDotEnvValue('NEXT_PUBLIC_SUPABASE_URL') || readDotEnvValue('SUPABASE_URL');
const dotEnvSupabaseAnonKey =
  readDotEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY') ||
  readDotEnvValue('NEXT_PUBLIC_SUPABASE_KEY') ||
  readDotEnvValue('SUPABASE_ANON_KEY') ||
  readDotEnvValue('SUPABASE_KEY');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      dotEnvSupabaseUrl ||
      '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.VITE_SUPABASE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_KEY ||
      dotEnvSupabaseAnonKey ||
      '',
    NEXT_PUBLIC_E2E_MOCK:
      process.env.NEXT_PUBLIC_E2E_MOCK || '',
  },
};

export default nextConfig;
