"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Heart, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { acceptWorkspaceInvite } from "@/actions/invites";

const WORKSPACE_COOKIE = "workspace_id";

function setWorkspaceCookie(workspaceId: string) {
  document.cookie = `${WORKSPACE_COOKIE}=${workspaceId}; path=/; max-age=31536000; SameSite=Lax`;
}

export default function InviteAcceptPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "redirect">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Link de convite inválido. Token não encontrado.");
      return;
    }

    let cancelled = false;

    async function run() {
      const t = token;
      if (!t) return;
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (cancelled) return;
        const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "";
        const redirectTo = `/login?redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = redirectTo;
        return;
      }

      const result = await acceptWorkspaceInvite(t);
      if (cancelled) return;

      if (result.ok) {
        setWorkspaceCookie(result.workspaceId);
        setStatus("success");
        setTimeout(() => {
          if (!cancelled) {
            setStatus("redirect");
            window.location.href = "/dashboard";
          }
        }, 1500);
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "Não foi possível aceitar o convite.");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 bg-background">
      <div className="w-full max-w-md">
        <div className="bg-card border border-border rounded-2xl p-8 shadow-card text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-foreground font-bold tracking-tight mb-8"
          >
            <Heart className="h-6 w-6 text-accent" fill="currentColor" />
            <span className="text-gradient-hero">Nosso Futuro</span>
          </Link>

          {status === "loading" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2 font-sans">
                Aceitando convite...
              </h1>
              <p className="text-sm text-muted-foreground">
                Aguarde enquanto adicionamos você ao workspace.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2 font-sans">
                Convite aceito!
              </h1>
              <p className="text-sm text-muted-foreground">
                Você foi adicionado ao workspace. Redirecionando...
              </p>
            </>
          )}

          {status === "redirect" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2 font-sans">
                Redirecionando para o dashboard...
              </h1>
            </>
          )}

          {status === "error" && (
            <>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600 mb-4">
                <AlertCircle className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2 font-sans">
                Convite inválido
              </h1>
              <p className="text-sm text-muted-foreground mb-6">
                {errorMessage}
              </p>
              <Link
                href="/dashboard"
                className="inline-flex justify-center w-full bg-hero-gradient text-primary-foreground font-semibold py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity"
              >
                Ir para o dashboard
              </Link>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Voltar para a home
          </Link>
        </p>
      </div>
    </div>
  );
}
