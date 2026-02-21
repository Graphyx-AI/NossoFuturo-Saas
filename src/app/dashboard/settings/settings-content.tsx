"use client";

import { useState } from "react";
import { PRODUCT_CONFIG } from "@/lib/product-config";
import { User, LogOut, Trash2, Moon, Palette, Type, Eye, Sun, LifeBuoy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Link } from "@/i18n/navigation";
import { useTheme } from "@/components/theme-provider";
import {
  useAccessibility,
  type ColorTheme,
  type FontSize,
} from "@/components/accessibility-provider";
import type { Workspace } from "@/types/database";
import { deleteAccount } from "@/actions/auth";
import { SupportRequestForm } from "@/components/settings/support-request-form";
import { LocationConsentCard } from "@/components/settings/location-consent-card";
import { BillingCard } from "@/components/settings/billing-card";

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; helper: string }[] = [
  { value: "normal", label: "Normal", helper: "Padrão do app" },
  { value: "grande", label: "Grande", helper: "Leitura facilitada" },
  { value: "muito-grande", label: "Muito grande", helper: "Máxima legibilidade" },
];

const COLOR_THEME_OPTIONS: { value: ColorTheme; label: string; swatch: string }[] = [
  { value: "padrao", label: "Padrão", swatch: "hsl(160 45% 45%)" },
  { value: "rosa", label: "Rosa", swatch: "hsl(330 65% 50%)" },
  { value: "azul", label: "Azul", swatch: "hsl(217 70% 52%)" },
  { value: "amarelo", label: "Amarelo", swatch: "hsl(38 92% 52%)" },
];

export function SettingsContent({
  userEmail,
  workspaces,
  currentWorkspaceId,
  currentWorkspacePlan,
  hasStripeSubscription,
}: {
  userEmail: string | undefined;
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  currentWorkspacePlan?: "pro";
  hasStripeSubscription?: boolean;
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
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-muted-foreground">
          Gerencie conta, acessibilidade, suporte e preferências.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <User size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Conta</h2>
            <p className="text-sm text-muted-foreground">Dados da sua conta logada.</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-secondary/20 p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
          <p className="text-sm font-semibold text-foreground">{displayEmail}</p>
        </div>
      </section>

      <section id="accessibility" className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8 scroll-mt-20">
        <h2 className="text-xl font-bold text-foreground">Visual e acessibilidade</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl border border-border px-4 py-3 text-left transition-colors hover:bg-secondary/30"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              Tema
            </span>
            <p className="mt-1 text-xs text-muted-foreground">
              Atual: {theme === "dark" ? "Escuro" : "Claro"}
            </p>
          </button>

          <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
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

          <label className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Palette size={16} />
              Menos animação
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
                  className={`rounded-lg border px-3 py-1 text-xs ${
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
                  className={`rounded-lg border px-3 py-1 text-xs ${
                    a11y.colorTheme === c.value
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                  aria-pressed={a11y.colorTheme === c.value}
                >
                  <span
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                    style={{ backgroundColor: c.swatch }}
                  />
                  {c.label}
                </button>
              ))}
              <button
                type="button"
                onClick={resetToDefaults}
                className="rounded-lg border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Resetar
              </button>
            </div>
          </div>
        </div>
      </section>

      <LocationConsentCard />

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <LifeBuoy size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Suporte</h2>
            <p className="text-sm text-muted-foreground">
              Envie seu problema e ele chega direto em <strong>graphyx.ai@gmail.com</strong>.
            </p>
          </div>
        </div>
        <SupportRequestForm
          workspaces={workspaces}
          currentWorkspaceId={currentWorkspaceId}
          defaultEmail={displayEmail === "-" ? "" : displayEmail}
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
        <h2 className="text-xl font-bold text-foreground">Plano</h2>
        <p className="mt-1 text-sm text-muted-foreground">{PRODUCT_CONFIG.trialDays} dias de teste grátis e até {PRODUCT_CONFIG.maxWorkspaces} workspaces.</p>
        <div className="mt-4">
          <BillingCard
            workspaceId={currentWorkspaceId}
            currentPlan={currentWorkspacePlan ?? "pro"}
            hasSubscription={hasStripeSubscription ?? false}
          />
        </div>
      </section>

      <div className="flex flex-col items-center gap-4 pt-8">
        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-red-500 dark:hover:text-red-400"
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
          className="flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-red-600 dark:hover:text-red-400"
        >
          <Trash2 size={14} />
          Excluir minha conta
        </button>
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Link href="/terms" className="transition-colors hover:text-foreground">
            Termos
          </Link>
          <span>/</span>
          <Link href="/privacy" className="transition-colors hover:text-foreground">
            Privacidade
          </Link>
          <span>/</span>
          <Link href="/refund" className="transition-colors hover:text-foreground">
            Reembolso
          </Link>
        </div>
      </div>

      {deleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-account-title"
          onClick={() => !deleteLoading && setDeleteModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="modal-delete-account-title" className="mb-2 text-lg font-bold text-foreground">
              Excluir conta
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Tem certeza que deseja excluir sua conta? Todos os dados serão removidos e essa ação não
              pode ser desfeita.
            </p>
            {deleteError && <p className="mb-4 text-sm text-red-600 dark:text-red-400">{deleteError}</p>}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => !deleteLoading && setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="rounded-xl border border-border px-4 py-2 font-medium text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                className="rounded-xl bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
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
