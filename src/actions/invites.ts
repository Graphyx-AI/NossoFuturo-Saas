"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";
import { sendWorkspaceInviteEmail } from "@/lib/email/resend";
import { randomBytes } from "crypto";

const createInviteSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email("E-mail invalido"),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

const createInviteLinkSchema = z.object({
  workspaceId: z.string().uuid(),
  guestName: z
    .string()
    .trim()
    .min(1, "Informe o nome da pessoa.")
    .max(80, "Nome muito longo."),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

export type CreateInviteResult =
  | { ok: true }
  | { ok: false; error: string };

export type CreateInviteLinkResult =
  | { ok: true; inviteUrl: string }
  | { ok: false; error: string };

function sanitizeInviteGuestName(name: string) {
  return name.replace(/\s+/g, " ").trim();
}

function buildInviteLinkMarker(guestName: string) {
  const normalized = sanitizeInviteGuestName(guestName).replace(/[:]+/g, "");
  return `link::${normalized}::${randomBytes(6).toString("hex")}`;
}

function generateInviteToken() {
  return randomBytes(18).toString("base64url");
}

function getInviteExpiryIsoString() {
  // Convites sem expiracao pratica (100 anos).
  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 100);
  return expiresAt.toISOString();
}

async function getAppUrl() {
  try {
    const h = await headers();
    const origin = h.get("origin");
    if (origin) return origin.replace(/\/$/, "");

    const proto = h.get("x-forwarded-proto");
    const forwardedHost = h.get("x-forwarded-host");
    if (proto && forwardedHost) return `${proto}://${forwardedHost}`.replace(/\/$/, "");

    const host = h.get("host");
    if (host) {
      const scheme = process.env.NODE_ENV === "production" ? "https" : "http";
      return `${scheme}://${host}`.replace(/\/$/, "");
    }
  } catch {
    // Fora de contexto de request (ex.: testes), usa fallback de env.
  }

  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export async function createWorkspaceInvite(
  workspaceId: string,
  email: string,
  role: "admin" | "editor" | "viewer" = "editor"
): Promise<CreateInviteResult> {
  const parsed = createInviteSchema.safeParse({
    workspaceId,
    email: email.trim().toLowerCase(),
    role,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado" };

  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  const roleStr = (memberRow as { role?: string } | null)?.role;
  if (!roleStr || !["owner", "admin"].includes(roleStr)) {
    return { ok: false, error: "Apenas donos e admins podem convidar membros." };
  }

  const { data: existingInvite } = await supabase
    .from("workspace_invites")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("email", parsed.data.email)
    .limit(1);

  const { data: members } = await supabase
    .from("workspace_members")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .not("accepted_at", "is", null);
  const memberEmails = await Promise.all(
    (members ?? []).map(async (m) => {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!serviceKey) return null;
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
      );
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      return data.user?.email?.toLowerCase() ?? null;
    })
  );
  if (memberEmails.includes(parsed.data.email)) {
    return { ok: false, error: "Este e-mail ja e membro do workspace." };
  }
  if (existingInvite?.length) {
    return { ok: false, error: "Ja existe um convite pendente para este e-mail." };
  }

  const token = generateInviteToken();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .single();

  const { error: insertError } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    email: parsed.data.email,
    role: parsed.data.role,
    token,
    invited_by: user.id,
    expires_at: getInviteExpiryIsoString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { ok: false, error: "Ja existe um convite pendente para este e-mail." };
    }
    return { ok: false, error: insertError.message };
  }

  const appUrl = await getAppUrl();
  const acceptUrl = `${appUrl}/i/${token}`;
  const emailResult = await sendWorkspaceInviteEmail({
    to: parsed.data.email,
    inviterName: profile?.full_name ?? "Alguem",
    workspaceName: workspace?.name ?? "Workspace",
    acceptUrl,
  });

  if (!emailResult.ok) {
    return {
      ok: false,
      error: emailResult.error ?? "Convite criado, mas falha ao enviar e-mail.",
    };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/pt/dashboard/settings");
  revalidatePath("/en/dashboard/settings");
  return { ok: true };
}

export async function createWorkspaceInviteLink(
  workspaceId: string,
  guestName: string,
  role: "admin" | "editor" | "viewer" = "editor"
): Promise<CreateInviteLinkResult> {
  const parsed = createInviteLinkSchema.safeParse({
    workspaceId,
    guestName,
    role,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Dados invalidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado" };

  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  const roleStr = (memberRow as { role?: string } | null)?.role;
  if (!roleStr || !["owner", "admin"].includes(roleStr)) {
    return { ok: false, error: "Apenas donos e admins podem convidar membros." };
  }

  const token = generateInviteToken();

  const marker = buildInviteLinkMarker(parsed.data.guestName);
  const { error: insertError } = await supabase.from("workspace_invites").insert({
    workspace_id: workspaceId,
    email: marker,
    role: parsed.data.role,
    token,
    invited_by: user.id,
    expires_at: getInviteExpiryIsoString(),
  });

  if (insertError) return { ok: false, error: insertError.message };

  const appUrl = await getAppUrl();
  const inviteUrl = `${appUrl}/i/${token}`;

  revalidatePath("/dashboard/settings");
  revalidatePath("/pt/dashboard/settings");
  revalidatePath("/en/dashboard/settings");

  return { ok: true, inviteUrl };
}

export type AcceptInviteResult =
  | { ok: true; workspaceId: string }
  | { ok: false; error: string };

export async function acceptWorkspaceInvite(token: string): Promise<AcceptInviteResult> {
  const supabase = await createClient();
  const normalizedToken = token.trim();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Faca login para aceitar o convite." };

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return { ok: false, error: "Erro de configuracao." };

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  const { data: inviteRows, error: rpcError } = await supabase.rpc(
    "get_workspace_invite_by_token",
    { invite_token: normalizedToken }
  );

  let invite: Record<string, unknown> | null =
    Array.isArray(inviteRows) ? ((inviteRows[0] as Record<string, unknown> | undefined) ?? null) : null;

  if (!invite) {
    const { data: rawInvite, error: rawInviteError } = await admin
      .from("workspace_invites")
      .select("id, workspace_id, email, role, invited_by")
      .eq("token", normalizedToken)
      .maybeSingle();

    if (rawInviteError || !rawInvite) {
      if (rpcError && process.env.NODE_ENV !== "production") {
        console.warn("acceptWorkspaceInvite rpc error:", rpcError.message);
      }
      return { ok: false, error: "Convite invalido." };
    }

    invite = rawInvite as unknown as Record<string, unknown>;
  }

  const inviteEmail = (invite as { email?: string }).email?.toLowerCase();
  const inviteWorkspaceId = (invite as { workspace_id?: string }).workspace_id;
  const inviteRole = (invite as { role?: string }).role ?? "editor";
  const inviteId = (invite as { id?: string }).id;

  if (inviteEmail && !inviteEmail.startsWith("link::") && inviteEmail !== user.email.toLowerCase()) {
    return {
      ok: false,
      error: `Este convite foi enviado para ${inviteEmail}. Faca login com essa conta para aceitar.`,
    };
  }

  if (!inviteWorkspaceId) {
    return { ok: false, error: "Convite invalido." };
  }

  const { error: insertError } = await admin.from("workspace_members").insert({
    workspace_id: inviteWorkspaceId,
    user_id: user.id,
    role: inviteRole,
    invited_by: (invite as { invited_by?: string }).invited_by ?? null,
    accepted_at: new Date().toISOString(),
  });
  if (insertError) {
    if (insertError.code === "23505") {
      await admin.from("workspace_invites").delete().eq("id", inviteId);
      return { ok: true, workspaceId: inviteWorkspaceId };
    }
    return { ok: false, error: insertError.message };
  }

  await admin.from("workspace_invites").delete().eq("id", inviteId);
  revalidatePath("/dashboard");
  revalidatePath("/pt/dashboard");
  revalidatePath("/en/dashboard");
  return { ok: true, workspaceId: inviteWorkspaceId };
}

export async function getWorkspaceInvites(workspaceId: string | null) {
  if (!workspaceId) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("workspace_invites")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function cancelWorkspaceInvite(inviteId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado" };

  const { data: invite } = await supabase
    .from("workspace_invites")
    .select("workspace_id")
    .eq("id", inviteId)
    .single();
  if (!invite) return { ok: false, error: "Convite nao encontrado" };

  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  const roleStr = (memberRow as { role?: string } | null)?.role;
  if (!roleStr || !["owner", "admin"].includes(roleStr)) {
    return { ok: false, error: "Sem permissao para cancelar convites." };
  }

  const { error } = await supabase.from("workspace_invites").delete().eq("id", inviteId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/pt/dashboard/settings");
  revalidatePath("/en/dashboard/settings");
  return { ok: true };
}

export type WorkspaceMemberWithProfile = {
  id: string;
  user_id: string;
  role: string;
  full_name: string;
  email?: string;
};

export async function getWorkspaceMembersWithProfiles(
  workspaceId: string | null
): Promise<WorkspaceMemberWithProfile[]> {
  if (!workspaceId) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: rows, error: rpcError } = await supabase.rpc("get_workspace_members_with_profiles", {
    ws_id: workspaceId,
  });
  let members = (Array.isArray(rows) ? rows : rows ? [rows] : []) as {
    id: string;
    user_id: string;
    role: string;
    full_name: string;
  }[];

  if (rpcError || members.length === 0) {
    const { data: memberRows } = await supabase
      .from("workspace_members")
      .select("id, user_id, role")
      .eq("workspace_id", workspaceId)
      .not("accepted_at", "is", null);

    const memberList = (memberRows ?? []) as { id: string; user_id: string; role: string }[];
    const userIds = memberList.map((m) => m.user_id);

    let nameByUserId = new Map<string, string>();
    if (userIds.length > 0) {
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      nameByUserId = new Map(
        (profileRows ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "Usuario"])
      );
    }

    members = memberList.map((m) => ({
      id: m.id,
      user_id: m.user_id,
      role: m.role,
      full_name: nameByUserId.get(m.user_id) ?? "Usuario",
    }));
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const result: WorkspaceMemberWithProfile[] = [];
  for (const m of members) {
    let email: string | undefined;
    if (serviceKey) {
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        { auth: { persistSession: false } }
      );
      const { data } = await admin.auth.admin.getUserById(m.user_id);
      email = data.user?.email;
    }
    result.push({ ...m, email });
  }
  return result;
}

export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nao autorizado" };
  if (user.id === userId) return { ok: false, error: "Voce nao pode remover a si mesmo." };

  const { data: memberRow } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .not("accepted_at", "is", null)
    .single();
  const roleStr = (memberRow as { role?: string } | null)?.role;
  if (!roleStr || !["owner", "admin"].includes(roleStr)) {
    return { ok: false, error: "Sem permissao para remover membros." };
  }

  const { data: target } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();
  if (!target) return { ok: false, error: "Membro nao encontrado." };
  if (target.role === "owner") {
    return { ok: false, error: "Nao e possivel remover o dono do workspace." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/pt/dashboard/settings");
  revalidatePath("/en/dashboard/settings");
  return { ok: true };
}
