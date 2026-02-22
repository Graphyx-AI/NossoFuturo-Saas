#!/usr/bin/env node
/**
 * Setup Admin - cria usuarios admin no Supabase
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
    console.error('Arquivo .env nao encontrado. Crie o arquivo .env na raiz do projeto');
    process.exit(1);
  }

  const content = readFileSync(envPath, 'utf-8').replace(/^\uFEFF/, '');
  const env = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([^=\s]+)\s*=\s*(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
  return env;
}

async function createOrSkipUser(supabase, config) {
  const { email, password, workspace } = config;

  console.log(`- ${email} (${workspace})`);

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { workspace }
  });

  if (!error) {
    console.log(`  criado: ${data.user?.id || '-'}`);
    return;
  }

  if (error.message?.includes('already been registered') || error.code === 'user_already_exists') {
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (listError) {
      throw listError;
    }

    const existingUser = (usersData?.users || []).find(
      (user) => String(user.email || '').trim().toLowerCase() === String(email).trim().toLowerCase()
    );

    if (!existingUser?.id) {
      console.log('  ja existe (nao foi possivel localizar id para atualizar metadata)');
      return;
    }

    const currentWorkspace =
      existingUser.user_metadata?.workspace ||
      existingUser.user_metadata?.workspace_id ||
      null;

    if (String(currentWorkspace || '').trim().toLowerCase() === String(workspace).trim().toLowerCase()) {
      console.log('  ja existe');
      return;
    }

    const nextMetadata = {
      ...(existingUser.user_metadata || {}),
      workspace
    };

    const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: nextMetadata,
      email_confirm: true
    });

    if (updateError) {
      throw updateError;
    }

    console.log('  ja existe (metadata workspace atualizado)');
    return;
  }

  throw error;
}

async function main() {
  console.log('Setup de admins CRM\n');

  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    console.error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL nao definido no .env');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY nao definido no .env');
    process.exit(1);
  }

  const admins = [
    {
      email: env.GRAPHYX_ADMIN_EMAIL || env.NEXT_PUBLIC_GRAPHYX_ADMIN_EMAIL || 'graphyx.ai@gmail.com',
      password: env.GRAPHYX_ADMIN_PASSWORD || '@101222Tlc',
      workspace: 'graphyx'
    },
    {
      email:
        env.LUMYF_ADMIN_EMAIL ||
        env.NEXT_PUBLIC_LUMYF_ADMIN_EMAIL ||
        'lumyf@gmail.com',
      password: env.LUMYF_ADMIN_PASSWORD || '@101222Tlc',
      workspace: 'lumyf'
    }
  ];

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    for (const admin of admins) {
      await createOrSkipUser(supabase, admin);
    }
    console.log('\nConcluido.');
  } catch (err) {
    console.error('\nErro:', err.message || err);
    process.exit(1);
  }
}

main();
