"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Check,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import type { Workspace, WorkspaceInvite } from "@/types/database";
import type { WorkspaceMemberWithProfile } from "@/actions/invites";
import {
  createWorkspace,
  deleteWorkspace,
  updateWorkspaceName,
} from "@/actions/workspaces";
import { WorkspaceMembersClient } from "@/components/settings/workspace-members-client";

export function WorkspaceManagerClient({
  userId,
  workspaces,
  currentWorkspaceId,
  workspaceMembers,
  workspaceInvites,
  canManageMembers,
}: {
  userId: string | null;
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  workspaceMembers: WorkspaceMemberWithProfile[];
  workspaceInvites: WorkspaceInvite[];
  canManageMembers: boolean;
}) {
  const router = useRouter();
  const [optimisticWorkspaceId, setOptimisticWorkspaceId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const activeWorkspaceId = optimisticWorkspaceId ?? currentWorkspaceId;
  const activeWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId]
  );

  async function setWorkspace(workspaceId: string) {
    const previousWorkspaceId = optimisticWorkspaceId ?? currentWorkspaceId;
    setOptimisticWorkspaceId(workspaceId);

    const response = await fetch("/api/set-workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspace_id: workspaceId }),
    });

    if (!response.ok) {
      setOptimisticWorkspaceId(previousWorkspaceId);
      throw new Error(await response.text());
    }

    startTransition(() => router.refresh());
  }

  async function handleCreateWorkspace(e: React.FormEvent) {
    e.preventDefault();
    setActionError(null);
    setLoadingCreate(true);

    const result = await createWorkspace(newWorkspaceName);
    if (!result.ok) {
      setActionError(result.error);
      setLoadingCreate(false);
      return;
    }

    try {
      await setWorkspace(result.workspaceId);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Erro ao trocar workspace.");
      setLoadingCreate(false);
      return;
    }

    setNewWorkspaceName("");
    setCreating(false);
    setLoadingCreate(false);
  }

  async function handleSaveName(workspaceId: string) {
    setActionError(null);
    const result = await updateWorkspaceName(workspaceId, editName);
    if (!result.ok) {
      setActionError(result.error);
      return;
    }
    setEditingWorkspaceId(null);
    setEditName("");
    startTransition(() => router.refresh());
  }

  async function handleDeleteWorkspace(workspace: Workspace) {
    const confirmed = window.confirm(
      `Excluir o workspace "${workspace.name}"? Essa acao nao pode ser desfeita.`
    );
    if (!confirmed) return;

    setActionError(null);
    setDeletingWorkspaceId(workspace.id);

    const result = await deleteWorkspace(workspace.id);
    if (!result.ok) {
      setActionError(result.error);
      setDeletingWorkspaceId(null);
      return;
    }

    if (result.nextWorkspaceId) {
      try {
        await setWorkspace(result.nextWorkspaceId);
      } catch (error) {
        setActionError(error instanceof Error ? error.message : "Erro ao trocar workspace.");
      }
    } else {
      startTransition(() => router.refresh());
    }

    setDeletingWorkspaceId(null);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <header className="mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Workspace</h1>
        <p className="text-muted-foreground mt-1">
          Crie, edite e exclua seus workspaces e gerencie membros.
        </p>
      </header>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Seus workspaces</h2>
            <p className="text-sm text-muted-foreground">Escolha o ativo e gerencie os que voce criou.</p>
          </div>
        </div>

        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setCreating((value) => !value);
            }}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors"
          >
            {creating ? <X size={14} /> : <Plus size={14} />}
            {creating ? "Fechar" : "Novo workspace"}
          </button>
        </div>

        {creating && (
          <form
            onSubmit={handleCreateWorkspace}
            className="mb-4 p-4 rounded-xl border border-border bg-secondary/20 space-y-3"
          >
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome do workspace
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="Ex: Empresa, Casa, Projetos"
                required
                minLength={2}
                maxLength={60}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button
                type="submit"
                disabled={loadingCreate}
                className="px-4 py-2.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-70 inline-flex items-center justify-center gap-2"
              >
                {loadingCreate ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar"
                )}
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {workspaces.map((workspace) => {
            const isActive = activeWorkspaceId === workspace.id;
            const isOwner = workspace.owner_id === userId;
            const isEditing = editingWorkspaceId === workspace.id;
            const isDeleting = deletingWorkspaceId === workspace.id;

            return (
              <div
                key={workspace.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary/30"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => !isPending && !isDeleting && setWorkspace(workspace.id)}
                    disabled={isPending || isDeleting}
                    className="text-left flex items-center gap-4 disabled:opacity-70"
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm ${
                        isActive ? "bg-primary ring-2 ring-primary/20" : "bg-muted-foreground/40"
                      }`}
                    />
                    <div>
                      <span className="font-bold text-foreground block">{workspace.name}</span>
                      <span className="text-xs text-muted-foreground">({workspace.plan})</span>
                    </div>
                    <ShieldCheck
                      size={18}
                      className={isActive ? "text-primary" : "text-muted-foreground/40"}
                    />
                  </button>

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            minLength={2}
                            maxLength={60}
                            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveName(workspace.id)}
                            className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                            title="Salvar nome"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWorkspaceId(null);
                              setEditName("");
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                            title="Cancelar edicao"
                          >
                            <X size={16} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWorkspaceId(workspace.id);
                              setEditName(workspace.name);
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
                            title="Editar nome"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWorkspace(workspace)}
                            disabled={isDeleting}
                            className="p-2 rounded-lg text-rose-600 hover:bg-rose-500/10 transition-colors disabled:opacity-70"
                            title="Excluir workspace"
                          >
                            {isDeleting ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {actionError && (
          <p className="mt-3 text-sm text-rose-600" role="alert">
            {actionError}
          </p>
        )}
      </section>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors">
        <h2 className="text-xl font-bold text-foreground mb-1">
          Membros e convites {activeWorkspace ? `- ${activeWorkspace.name}` : ""}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Convide pessoas e gerencie acessos do workspace ativo.
        </p>
        <WorkspaceMembersClient
          workspaceId={activeWorkspaceId}
          members={workspaceMembers}
          invites={workspaceInvites}
          canManage={canManageMembers}
          currentUserId={userId}
        />
      </section>
    </div>
  );
}
