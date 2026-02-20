"use client";

import { useState } from "react";
import {
  User,
  Briefcase,
  Users,
  LogOut,
  Trash2,
  Moon,
  Palette,
  Type,
  Eye,
  Sun,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import {
  useAccessibility,
  type ColorTheme,
  type FontSize,
} from "@/components/accessibility-provider";
import type { Workspace, WorkspaceInvite } from "@/types/database";
import type { WorkspaceMemberWithProfile } from "@/actions/invites";
import { SettingsClient } from "./settings-client";
import { WorkspaceMembersClient } from "@/components/settings/workspace-members-client";
import { deleteAccount } from "@/actions/auth";

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; helper: string }[] = [
  { value: "normal", label: "Normal", helper: "Padrao do app" },
  { value: "grande", label: "Grande", helper: "Leitura facilitada" },
  { value: "muito-grande", label: "Muito grande", helper: "Maxima legibilidade" },
];

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "padrao", label: "Padrao", swatch: "hsl(160 45% 45%)" },
  { value: "rosa", label: "Rosa", swatch: "hsl(330 65% 50%)" },
  { value: "azul", label: "Azul", swatch: "hsl(217 70% 52%)" },
  { value: "amarelo", label: "Amarelo", swatch: "hsl(38 92% 52%)" },
];

export function SettingsContent({
  userEmail,
  userId,
  workspaces,
  currentWorkspaceId,
  workspaceMembers,
  workspaceInvites,
  canManageMembers,
}: {
  userEmail: string | undefined;
  userId: string | null;
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  workspaceMembers: WorkspaceMemberWithProfile[];
  workspaceInvites: WorkspaceInvite[];
  canManageMembers: boolean;
}) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const {
    settings: a11y,
    setColorTheme,
    setFontSize,
    setHighContrast,
    setReducedMotion,
    resetToDefaults,
  } = useAccessibility();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  async function handleConfirmDelete() {
    setDeleteLoading(true);
    setDeleteError(null);
    const result = await deleteAccount();
    if (result.ok) {
      const supabase = createClient();
      await supabase.auth.signOut();
      window.location.href = "/";
      return;
    }
    setDeleteError(result.error);
    setDeleteLoading(false);
  }

  const displayEmail = userEmail ?? "-";
  const shortEmail =
    displayEmail !== "-" && displayEmail.includes("@")
      ? `${displayEmail.split("@")[0]}...`
      : displayEmail;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie sua conta, workspaces e preferencias.
        </p>
      </header>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Conta</h2>
            <p className="text-sm text-muted-foreground">Dados da sua conta logada.</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Email</p>
          <p className="text-sm font-semibold text-foreground">{displayEmail}</p>
        </div>
      </section>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Briefcase size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Workspace</h2>
            <p className="text-sm text-muted-foreground">Selecione o workspace ativo.</p>
          </div>
        </div>
        <SettingsClient workspaces={workspaces} currentWorkspaceId={currentWorkspaceId} />
      </section>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Membros e convites</h2>
            <p className="text-sm text-muted-foreground">Gerencie acesso ao workspace.</p>
          </div>
        </div>
        <WorkspaceMembersClient
          workspaceId={currentWorkspaceId}
          members={workspaceMembers}
          invites={workspaceInvites}
          canManage={canManageMembers}
          currentUserId={userId}
        />
      </section>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors space-y-4">
        <h2 className="text-xl font-bold text-foreground">Visual e acessibilidade</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl border border-border px-4 py-3 text-left hover:bg-secondary/30 transition-colors"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              Tema
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              Atual: {theme === "dark" ? "Escuro" : "Claro"}
            </p>
          </button>

          <label className="rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Eye size={16} />
              Alto contraste
            </span>
            <input
              type="checkbox"
              checked={a11y.highContrast}
              onChange={(e) => setHighContrast(e.target.checked)}
            />
          </label>

          <label className="rounded-xl border border-border px-4 py-3 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Palette size={16} />
              Menos animacao
            </span>
            <input
              type="checkbox"
              checked={a11y.reducedMotion}
              onChange={(e) => setReducedMotion(e.target.checked)}
            />
          </label>

          <div className="rounded-xl border border-border px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Type size={16} />
              Fonte
            </span>
            <div className="mt-2 grid grid-cols-1 gap-2">
              {FONT_SIZE_OPTIONS.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => setFontSize(size.value)}
                  className={`px-3 py-1 rounded-lg text-xs border ${
                    a11y.fontSize === size.value
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                  aria-pressed={a11y.fontSize === size.value}
                >
                  <span className="font-semibold">{size.label}</span>{" "}
                  <span className="opacity-75">- {size.helper}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border px-4 py-3 sm:col-span-2">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Palette size={16} />
              Paleta
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLOR_THEME_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColorTheme(c.value)}
                  className={`px-3 py-1 rounded-lg text-xs border ${
                    a11y.colorTheme === c.value
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                  aria-pressed={a11y.colorTheme === c.value}
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: c.swatch }}
                  />
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={resetToDefaults}
                className="px-3 py-1 rounded-lg text-xs border border-border text-muted-foreground"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 transition-colors">
        <h2 className="text-xl font-bold text-foreground mb-2">Plano</h2>
        <p className="text-sm text-muted-foreground">
          O app esta sem integracao de pagamentos no momento.
        </p>
      </section>

      <div className="pt-8 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-semibold text-muted-foreground hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-2"
        >
          <LogOut size={14} />
          Sair da conta {shortEmail}
        </button>
        <button
          type="button"
          onClick={() => {
            setDeleteError(null);
            setDeleteModalOpen(true);
          }}
          className="text-sm font-semibold text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2"
        >
          <Trash2 size={14} />
          Excluir minha conta
        </button>
        <a
          href="/termos"
          className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] hover:text-foreground transition-colors"
        >
          Termos de uso & Privacidade
        </a>
      </div>

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-account-title"
          onClick={() => !deleteLoading && setDeleteModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-card w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-delete-account-title" className="font-bold text-foreground text-lg mb-2">
              Excluir conta
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Tem certeza que deseja excluir sua conta? Todos os dados serao removidos e essa acao nao pode ser desfeita.
            </p>
            {deleteError && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{deleteError}</p>}
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl font-medium text-muted-foreground hover:text-foreground border border-border hover:bg-secondary/50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50"
              >
                {deleteLoading ? "Excluindo..." : "Sim, excluir conta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
