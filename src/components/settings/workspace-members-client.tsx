"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Link as LinkIcon, Loader2, UserMinus, X, Copy, Check } from "lucide-react";
import {
  createWorkspaceInviteLink,
  cancelWorkspaceInvite,
  removeWorkspaceMember,
} from "@/actions/invites";
import type { WorkspaceInvite } from "@/types/database";
import type { WorkspaceMemberWithProfile } from "@/actions/invites";

const ROLE_LABELS: Record<string, string> = {
  owner: "Dono",
  admin: "Admin",
  editor: "Editor",
  viewer: "Visualizador",
};

function getInviteDisplay(email: string) {
  if (!email.startsWith("link::")) return email;
  const parts = email.split("::");
  const name = (parts[1] ?? "convidado").trim();
  return `Link para: ${name || "convidado"}`;
}

export function WorkspaceMembersClient({
  workspaceId,
  members,
  invites,
  canManage,
  currentUserId,
}: {
  workspaceId: string | null;
  members: WorkspaceMemberWithProfile[];
  invites: WorkspaceInvite[];
  canManage: boolean;
  currentUserId: string | null;
}) {
  const router = useRouter();
  const [guestName, setGuestName] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const currentMembership = members.find((member) => member.user_id === currentUserId);
  const canManageActions =
    canManage || currentMembership?.role === "owner" || currentMembership?.role === "admin";

  if (!workspaceId) {
    return (
      <p className="text-sm text-muted-foreground">Selecione um workspace para gerenciar membros.</p>
    );
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!workspaceId) return;
    setInviteError(null);
    setCopied(false);
    setInviteLoading(true);
    const result = await createWorkspaceInviteLink(workspaceId, guestName, role);
    setInviteLoading(false);
    if (result.ok) {
      setGuestName("");
      setInviteLink(result.inviteUrl);
    } else {
      setInviteError(result.error ?? "Erro ao gerar link");
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function handleRemove(userId: string) {
    if (!workspaceId) return;
    setInviteError(null);
    setRemovingId(userId);
    const result = await removeWorkspaceMember(workspaceId, userId);
    setRemovingId(null);
    if (!result.ok) {
      setInviteError(result.error ?? "Nao foi possivel remover membro.");
      return;
    }
    router.refresh();
  }

  async function handleCancelInvite(inviteId: string) {
    setInviteError(null);
    setCancellingId(inviteId);
    const result = await cancelWorkspaceInvite(inviteId);
    setCancellingId(null);
    if (!result.ok) {
      setInviteError(result.error ?? "Nao foi possivel cancelar convite.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Membros</h3>
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl bg-secondary/30 border border-border"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Users size={16} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{m.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.email ?? "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-medium px-2 py-1 rounded-lg bg-secondary text-muted-foreground">
                  {ROLE_LABELS[m.role] ?? m.role}
                </span>
                {m.role !== "owner" && m.user_id !== currentUserId && (
                  <button
                    type="button"
                    onClick={() => handleRemove(m.user_id)}
                    disabled={removingId === m.user_id}
                    className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                    title="Remover membro"
                  >
                    {removingId === m.user_id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <UserMinus size={16} />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
          {members.length === 0 && (
            <li className="p-4 rounded-xl bg-secondary/30 border border-border text-sm text-muted-foreground">
              Nenhum membro no momento.
            </li>
          )}
        </ul>
      </div>

      {invites.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Convites pendentes</h3>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <LinkIcon size={18} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="font-medium text-foreground truncate">{getInviteDisplay(inv.email)}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_LABELS[inv.role] ?? inv.role}
                    </p>
                  </div>
                </div>
                {canManageActions && (
                  <button
                    type="button"
                    onClick={() => handleCancelInvite(inv.id)}
                    disabled={cancellingId === inv.id}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors disabled:opacity-50"
                    title="Cancelar convite"
                  >
                    {cancellingId === inv.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <X size={16} />
                    )}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleInvite} className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Convidar por link</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            placeholder="Nome da pessoa"
            required
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
          >
            <option value="editor">Editor</option>
            <option value="viewer">Visualizador</option>
          </select>
          <button
            type="submit"
            disabled={inviteLoading}
            className="px-4 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {inviteLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Gerando...
              </>
            ) : (
              "Gerar link"
            )}
          </button>
        </div>

        {inviteLink && (
          <div className="rounded-xl border border-border p-3 bg-secondary/20 space-y-2">
            <p className="text-xs text-muted-foreground">Link de convite</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-xs"
              />
              <button
                type="button"
                onClick={copyInviteLink}
                className="px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary transition-colors inline-flex items-center gap-2 justify-center"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>
        )}

        {inviteError && (
          <p className="text-sm text-rose-600" role="alert">
            {inviteError}
          </p>
        )}
      </form>
    </div>
  );
}
