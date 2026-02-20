"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "next/navigation";
import { Heart, User, Users, Building2, MoreHorizontal, Loader2 } from "lucide-react";
import {
  saveOnboardingIntent,
  updateWorkspaceName,
  completeOnboarding,
} from "@/actions/onboarding";
import { setTourPending } from "./guided-tour";

const INTENT_OPTIONS = [
  { id: "personal" as const, label: "Só para mim", icon: User, desc: "Organizar minhas finanças pessoais" },
  { id: "family" as const, label: "Para mim e minha família", icon: Users, desc: "Casa, casal ou família" },
  { id: "business" as const, label: "Para minha empresa", icon: Building2, desc: "Gestão financeira do negócio" },
  { id: "other" as const, label: "Outro", icon: MoreHorizontal, desc: "Casal, equipe ou grupo" },
];

const SUGGESTIONS: Record<string, string[]> = {
  personal: ["Minhas Finanças", "Financeiro Pessoal", "Meu Controle"],
  family: ["Família Silva", "Casa", "Família"],
  business: ["Empresa X", "Meu Negócio", "Financeiro Empresa"],
  other: ["Nossas Finanças", "Equipe", "Compartilhado"],
};

type Intent = "personal" | "family" | "business" | "other";

interface OnboardingStepsProps {
  initialIntent: Intent | null;
  defaultWorkspaceId: string | null;
  defaultWorkspaceName: string;
}

export function OnboardingSteps({
  initialIntent,
  defaultWorkspaceId,
  defaultWorkspaceName,
}: OnboardingStepsProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [intent, setIntent] = useState<Intent | null>(initialIntent);
  const [workspaceName, setWorkspaceName] = useState(defaultWorkspaceName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSelectIntent(selected: Intent) {
    setIntent(selected);
    setError(null);
    setLoading(true);
    try {
      await saveOnboardingIntent(selected);
      setStep(2);
      const suggestions = SUGGESTIONS[selected];
      if (suggestions?.length) setWorkspaceName(suggestions[0]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleWorkspaceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!defaultWorkspaceId) return;
    setError(null);
    setLoading(true);
    try {
      await updateWorkspaceName(defaultWorkspaceId, workspaceName);
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    setError(null);
    setLoading(true);
    try {
      setTourPending();
      await completeOnboarding();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao concluir");
      setLoading(false);
    }
  }

  async function handleSkip() {
    setError(null);
    setLoading(true);
    try {
      await completeOnboarding();
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao pular");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="p-5 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold tracking-tight text-foreground shrink-0"
          >
            <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            <span className="text-gradient-hero">Nosso Futuro</span>
          </Link>
          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          >
            Pular
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                step >= s ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground font-medium">
          Passo {step} de 3
        </p>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8 sm:py-12 max-w-lg mx-auto w-full">
        {step === 1 && (
          <div className="w-full animate-fade">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 font-sans">
              Para quem você vai usar o Nosso Futuro?
            </h1>
            <p className="text-muted-foreground mb-8">
              Escolha a opção que melhor descreve seu uso.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {INTENT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectIntent(opt.id)}
                  disabled={loading}
                  className={`flex flex-col items-start gap-2 p-5 rounded-2xl border-2 text-left transition-all hover:border-primary/50 ${
                    intent === opt.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-secondary/50"
                  }`}
                >
                  <opt.icon className="h-6 w-6 text-primary" />
                  <span className="font-semibold text-foreground">{opt.label}</span>
                  <span className="text-sm text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-4 text-sm text-rose-600 font-medium" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="w-full animate-fade">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 font-sans">
              Como quer chamar seu espaço de finanças?
            </h1>
            <p className="text-muted-foreground mb-6">
              Dê um nome que faça sentido para você.
            </p>
            <form onSubmit={handleWorkspaceSubmit} className="space-y-4">
              <input
                type="text"
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                placeholder="Ex: Minhas Finanças"
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
              />
              {intent && SUGGESTIONS[intent]?.length && (
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS[intent].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setWorkspaceName(s)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              {error && (
                <p className="text-sm text-rose-600 font-medium" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-hero-gradient text-primary-foreground font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Continuar"
                )}
              </button>
            </form>
          </div>
        )}

        {step === 3 && (
          <div className="w-full animate-fade">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground mb-2 font-sans">
              Pronto para começar!
            </h1>
            <p className="text-muted-foreground mb-6">
              Você verá um <strong>tour guiado</strong> no app — seguimos juntos pelos caminhos para você aprender a registrar transações, metas e mais.
            </p>
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 mb-8">
              <p className="text-sm text-foreground leading-relaxed">
                O tour vai destacar cada área do menu e mostrar onde clicar. No celular, abra o menu (ícone ☰) no topo para ver a navegação.
              </p>
            </div>
            <button
              type="button"
              onClick={handleComplete}
              disabled={loading}
              className="w-full bg-hero-gradient text-primary-foreground font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Entrando no app...
                </>
              ) : (
                "Ver tour guiado no app"
              )}
            </button>
            {error && (
              <p className="mt-4 text-sm text-rose-600 font-medium text-center" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
