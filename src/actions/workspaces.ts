"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const DEFAULT_CATEGORIES = [
  { name: "Salário", icon: "💰", type: "income" as const, color: "#10b981" },
  { name: "Freelance", icon: "💸", type: "income" as const, color: "#06b6d4" },
  { name: "Presente", icon: "🎁", type: "income" as const, color: "#f59e0b" },
  { name: "Outros Recebimentos", icon: "📥", type: "income" as const, color: "#8b5cf6" },
  { name: "Supermercado", icon: "🛒", type: "expense" as const, color: "#ef4444" },
  { name: "Moradia", icon: "🏠", type: "expense" as const, color: "#f97316" },
  { name: "Transporte", icon: "🚗", type: "expense" as const, color: "#eab308" },
  { name: "Saúde", icon: "🏥", type: "expense" as const, color: "#22c55e" },
  { name: "Lazer", icon: "🍔", type: "expense" as const, color: "#3b82f6" },
  { name: "Compras", icon: "🛍️", type: "expense" as const, color: "#a855f7" },
  { name: "Outros Gastos", icon: "📦", type: "expense" as const, color: "#64748b" },
];

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureWorkspaceWithAdmin(user: { id: string; user_metadata?: Record<string, unknown> }) {
  const admin = getAdminClient();
  if (!admin) return false;

  const { data: existingMember } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (existingMember?.workspace_id) return true;

  await admin.from("profiles").upsert(
    {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? "Usuario",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  const slug = `personal-${user.id.replace(/-/g, "").slice(0, 32)}`;
  const { data: ws } = await admin
    .from("workspaces")
    .insert({ name: "Minhas Financas", slug, owner_id: user.id })
    .select("id")
    .single();

  if (!ws?.id) return false;

  await admin.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  for (const c of DEFAULT_CATEGORIES) {
    await admin.from("categories").insert({
      workspace_id: ws.id,
      name: c.name,
      icon: c.icon,
      type: c.type,
      color: c.color,
      is_system: true,
    });
  }

  return true;
}

export async function ensureDefaultWorkspace(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  // Tenta RPC primeiro (quando migration foi aplicada)
  const { data: rpcData, error: rpcError } = await supabase.rpc("ensure_user_workspace");
  if (!rpcError && rpcData) return true;

  // Fallback: cria workspace diretamente (com políticas RLS)
  // Garante que o profile existe (trigger pode não ter rodado)
  await supabase.from("profiles").upsert(
    {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? "Usuário",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  const slug = `personal-${user.id.replace(/-/g, "").slice(0, 32)}`;
  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name: "Minhas Finanças", slug, owner_id: user.id })
    .select("id")
    .single();

  if (wsError || !ws) {
    return ensureWorkspaceWithAdmin(user);
  }

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: "owner",
      accepted_at: new Date().toISOString(),
    });

  if (memberError) {
    return ensureWorkspaceWithAdmin(user);
  }

  for (const c of DEFAULT_CATEGORIES) {
    await supabase.from("categories").insert({
      workspace_id: ws.id,
      name: c.name,
      icon: c.icon,
      type: c.type,
      color: c.color,
      is_system: true,
    });
  }

  return true;
}

export async function getWorkspacesForUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: members } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);

  let ids = members?.map((m) => m.workspace_id) ?? [];
  if (!ids.length) {
    const admin = getAdminClient();
    if (!admin) return [];

    const { data: adminMembers } = await admin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", user.id)
      .not("accepted_at", "is", null);

    ids = adminMembers?.map((m) => m.workspace_id) ?? [];
    if (!ids.length) return [];
  }

  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: true });

  if (workspaces?.length) return workspaces;

  const admin = getAdminClient();
  if (!admin) return [];
  const { data: adminWorkspaces } = await admin
    .from("workspaces")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: true });

  return adminWorkspaces ?? [];
}

export async function getWorkspaceById(workspaceId: string | null) {
  if (!workspaceId) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .single();

  if (data) return data;

  const admin = getAdminClient();
  if (!admin) return null;

  const { data: member } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .limit(1)
    .maybeSingle();

  if (!member) return null;

  const { data: adminWorkspace } = await admin
    .from("workspaces")
    .select("*")
    .eq("id", workspaceId)
    .maybeSingle();

  return adminWorkspace ?? null;
}

const createWorkspaceSchema = z
  .string()
  .trim()
  .min(2, "Nome precisa ter ao menos 2 caracteres.")
  .max(60, "Nome muito longo.");

function slugifyWorkspaceName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export type CreateWorkspaceResult =
  | { ok: true; workspaceId: string }
  | { ok: false; error: string };

async function createWorkspaceWithClient(
  client: any,
  user: { id: string; user_metadata?: Record<string, unknown> },
  workspaceName: string
): Promise<CreateWorkspaceResult> {
  await client.from("profiles").upsert(
    {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) ?? "Usuario",
      avatar_url: user.user_metadata?.avatar_url ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  const slugBase = slugifyWorkspaceName(workspaceName) || "workspace";
  const slug = `${slugBase}-${Date.now().toString(36).slice(-6)}-${user.id.replace(/-/g, "").slice(0, 6)}`;
  const { data: ws, error: wsError } = await client
    .from("workspaces")
    .insert({ name: workspaceName, slug, owner_id: user.id })
    .select("id")
    .single();

  if (wsError || !ws?.id) {
    return { ok: false, error: wsError?.message ?? "Nao foi possivel criar o workspace." };
  }

  const { error: memberError } = await client.from("workspace_members").insert({
    workspace_id: ws.id,
    user_id: user.id,
    role: "owner",
    accepted_at: new Date().toISOString(),
  });

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  for (const c of DEFAULT_CATEGORIES) {
    await client.from("categories").insert({
      workspace_id: ws.id,
      name: c.name,
      icon: c.icon,
      type: c.type,
      color: c.color,
      is_system: true,
    });
  }

  return { ok: true, workspaceId: ws.id };
}

export async function createWorkspace(name: string): Promise<CreateWorkspaceResult> {
  const parsed = createWorkspaceSchema.safeParse(name);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado." };

  let result = await createWorkspaceWithClient(supabase, user, parsed.data);
  if (!result.ok) {
    const admin = getAdminClient();
    if (!admin) return result;
    result = await createWorkspaceWithClient(admin, user, parsed.data);
    if (!result.ok) return result;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workspace");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pt-BR/dashboard");
  revalidatePath("/pt-BR/dashboard/workspace");
  revalidatePath("/pt-BR/dashboard/settings");
  revalidatePath("/pt-PT/dashboard");
  revalidatePath("/pt-PT/dashboard/workspace");
  revalidatePath("/pt-PT/dashboard/settings");
  revalidatePath("/en/dashboard");
  revalidatePath("/en/dashboard/workspace");
  revalidatePath("/en/dashboard/settings");
  revalidatePath("/es/dashboard");
  revalidatePath("/es/dashboard/workspace");
  revalidatePath("/es/dashboard/settings");

  return result;
}

const updateWorkspaceSchema = z
  .string()
  .trim()
  .min(2, "Nome precisa ter ao menos 2 caracteres.")
  .max(60, "Nome muito longo.");

export type UpdateWorkspaceResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateWorkspaceName(
  workspaceId: string,
  name: string
): Promise<UpdateWorkspaceResult> {
  const parsedName = updateWorkspaceSchema.safeParse(name);
  if (!parsedName.success) {
    return { ok: false, error: parsedName.error.errors[0]?.message ?? "Dados invalidos." };
  }

  const parsedWorkspaceId = z.string().uuid().safeParse(workspaceId);
  if (!parsedWorkspaceId.success) {
    return { ok: false, error: "Workspace invalido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado." };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", parsedWorkspaceId.data)
    .single();

  if (!workspace || workspace.owner_id !== user.id) {
    return { ok: false, error: "Apenas o dono pode editar este workspace." };
  }

  let updateError: string | null = null;

  const { error } = await supabase
    .from("workspaces")
    .update({ name: parsedName.data })
    .eq("id", parsedWorkspaceId.data);
  updateError = error?.message ?? null;

  if (updateError) {
    const admin = getAdminClient();
    if (!admin) return { ok: false, error: updateError };
    const { error: adminError } = await admin
      .from("workspaces")
      .update({ name: parsedName.data })
      .eq("id", parsedWorkspaceId.data)
      .eq("owner_id", user.id);
    if (adminError) return { ok: false, error: adminError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workspace");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pt-BR/dashboard");
  revalidatePath("/pt-BR/dashboard/workspace");
  revalidatePath("/pt-BR/dashboard/settings");
  revalidatePath("/pt-PT/dashboard");
  revalidatePath("/pt-PT/dashboard/workspace");
  revalidatePath("/pt-PT/dashboard/settings");
  revalidatePath("/en/dashboard");
  revalidatePath("/en/dashboard/workspace");
  revalidatePath("/en/dashboard/settings");
  revalidatePath("/es/dashboard");
  revalidatePath("/es/dashboard/workspace");
  revalidatePath("/es/dashboard/settings");
  return { ok: true };
}

export type DeleteWorkspaceResult =
  | { ok: true; nextWorkspaceId: string | null }
  | { ok: false; error: string };

export async function deleteWorkspace(workspaceId: string): Promise<DeleteWorkspaceResult> {
  const parsedWorkspaceId = z.string().uuid().safeParse(workspaceId);
  if (!parsedWorkspaceId.success) {
    return { ok: false, error: "Workspace invalido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado." };

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id, owner_id")
    .eq("id", parsedWorkspaceId.data)
    .single();
  if (!workspace || workspace.owner_id !== user.id) {
    return { ok: false, error: "Apenas o dono pode excluir este workspace." };
  }

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .not("accepted_at", "is", null);

  const nextWorkspaceId =
    (memberships ?? []).find((m) => m.workspace_id !== parsedWorkspaceId.data)?.workspace_id ?? null;

  const admin = getAdminClient();
  if (admin) {
    const { error } = await admin
      .from("workspaces")
      .delete()
      .eq("id", parsedWorkspaceId.data)
      .eq("owner_id", user.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", parsedWorkspaceId.data)
      .eq("owner_id", user.id);
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/workspace");
  revalidatePath("/dashboard/settings");
  revalidatePath("/pt-BR/dashboard");
  revalidatePath("/pt-BR/dashboard/workspace");
  revalidatePath("/pt-BR/dashboard/settings");
  revalidatePath("/pt-PT/dashboard");
  revalidatePath("/pt-PT/dashboard/workspace");
  revalidatePath("/pt-PT/dashboard/settings");
  revalidatePath("/en/dashboard");
  revalidatePath("/en/dashboard/workspace");
  revalidatePath("/en/dashboard/settings");
  revalidatePath("/es/dashboard");
  revalidatePath("/es/dashboard/workspace");
  revalidatePath("/es/dashboard/settings");

  return { ok: true, nextWorkspaceId };
}
