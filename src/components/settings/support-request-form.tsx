"use client";

import { useState } from "react";
import { createSupportRequest } from "@/actions/support";
import type { Workspace } from "@/types/database";

export function SupportRequestForm({
  workspaces,
  currentWorkspaceId,
  defaultEmail,
}: {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  defaultEmail: string;
}) {
  const [workspaceId, setWorkspaceId] = useState<string>(currentWorkspaceId ?? "");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<"bug" | "billing" | "feature" | "account" | "other">("bug");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    setError(null);

    try {
      const result = await createSupportRequest({
        workspaceId: workspaceId || null,
        contactEmail,
        subject,
        category,
        priority,
        message,
      });

      if (!result.ok) {
        setError(result.error ?? "Erro ao enviar suporte.");
        return;
      }

      setFeedback(`Chamado registrado com sucesso. Protocolo: ${result.protocol}`);
      setSubject("");
      setMessage("");
      setPriority("medium");
      setCategory("bug");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workspace
          </span>
          <select
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <option value="">Sem workspace</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            E-mail de contato
          </span>
          <input
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Assunto
          </span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={160}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Categoria
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <option value="bug">Bug</option>
            <option value="billing">Plano</option>
            <option value="feature">Funcionalidade</option>
            <option value="account">Conta</option>
            <option value="other">Outro</option>
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm sm:col-span-2">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mensagem
          </span>
          <textarea
            required
            minLength={10}
            maxLength={4000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 resize-y"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Prioridade
          </span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as typeof priority)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5"
          >
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
      </div>

      {feedback && <p className="text-sm text-emerald-600">{feedback}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-hero-gradient px-5 py-2.5 font-semibold text-primary-foreground disabled:opacity-70"
      >
        {loading ? "Enviando..." : "Enviar suporte"}
      </button>
    </form>
  );
}
