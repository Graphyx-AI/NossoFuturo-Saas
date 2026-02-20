#!/usr/bin/env node
/**
 * Setup Admin - Cria o usuário admin no Supabase
 * Execute: npm run setup:admin
 * Requer: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


function loadEnv() {
  const envPath = resolve(__dirname, '..', '.env');
  if (!existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado. Crie o arquivo .env na raiz do projeto');
    process.exit(1);
  }
  const content = readFileSync(envPath, 'utf-8');
  const env = {};
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

async function main() {
  console.log('🔧 CRM GRAPYX - Setup Admin\n');

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = env.ADMIN_EMAIL || process.env.ADMIN_EMAIL || '';
  const adminPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '';

  if (!url) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL não definido no .env');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definido no .env');
    console.error('   Obtenha em: Supabase Dashboard > Settings > API > service_role key');
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (!adminEmail || !adminPassword) {
    console.error('❌ Defina ADMIN_EMAIL e ADMIN_PASSWORD como variáveis de ambiente para executar o setup.');
    process.exit(1);
  }

  console.log('📧 Email:', adminEmail);
  console.log('🔐 Senha:', '******** (via env)\n');

  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true
    });

    if (error) {
      if (error.message?.includes('already been registered') || error.code === 'user_already_exists') {
        console.log('ℹ️  Usuário já existe. Para resetar a senha, use:');
        console.log('   Supabase Dashboard > Authentication > Users > <admin-email> > ... > Reset password');
        process.exit(0);
      }
      throw error;
    }

    console.log('✅ Usuário admin criado com sucesso!');
    console.log('   ID:', data.user?.id || '-');
  } catch (err) {
    console.error('❌ Erro:', err.message || err);
    process.exit(1);
  }
}

main();
