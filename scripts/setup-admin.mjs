/**
 * Setup Admin — Cria um usuário de teste no Supabase Auth.
 * Uso: node scripts/setup-admin.mjs
 * Requer: .env.local com NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
 * Opcional: ADMIN_TEST_EMAIL e ADMIN_TEST_PASSWORD (senão usa os valores abaixo)
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Carrega .env.local se existir
function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      const key = m[1];
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL || "admin@teste.com";
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD || "admin123";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Erro: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log("Criando usuário de teste...");
  console.log("  E-mail:", ADMIN_EMAIL);
  console.log("  Senha: ", ADMIN_PASSWORD);

  const { data, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: "Admin Teste" },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      console.log("\nUsuário já existe. Use o login normal com:");
      console.log("  E-mail:", ADMIN_EMAIL);
      console.log("  Senha: ", ADMIN_PASSWORD);
      return;
    }
    console.error("Erro:", error.message);
    process.exit(1);
  }

  console.log("\nUsuário criado com sucesso.");
  console.log("Faça login em /login com:");
  console.log("  E-mail:", ADMIN_EMAIL);
  console.log("  Senha: ", ADMIN_PASSWORD);
}

main();
