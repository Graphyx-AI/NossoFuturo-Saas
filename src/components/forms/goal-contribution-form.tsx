"use client";

import { useState, useMemo } from "react";
import { createGoalContribution } from "@/actions/goals";
import { parseBRL, formatCurrency } from "@/lib/utils/currency";
import type { Goal } from "@/types/database";

export function GoalContributionForm({
  workspaceId,
  goals,
  contributionsByGoal = {},
  locale = "pt-BR",
}: {
  workspaceId: string;
  goals: Goal[];
  contributionsByGoal?: Record<string, number>;
  locale?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const today = new Date().toISOString().slice(0, 10);

  const selectedGoal = useMemo(() => goals.find((g) => g.id === selectedGoalId), [goals, selectedGoalId]);
  const suggestedMonthly = useMemo(() => {
    if (!selectedGoal) return null;
    const acc = contributionsByGoal[selectedGoal.id] ?? 0;
    const remaining = Math.max(0, selectedGoal.target_amount - acc);
    const deadline = selectedGoal.deadline ? new Date(selectedGoal.deadline + "T12:00:00") : null;
    if (!deadline || remaining <= 0) return null;
    const now = new Date();
    const monthsLeft = Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    return Math.ceil(remaining / monthsLeft);
  }, [selectedGoal, contributionsByGoal]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const goalId = formData.get("goal_id") as string;
    if (!goalId) {
      setToast("Selecione uma meta.");
      setLoading(false);
      return;
    }
    try {
      await createGoalContribution({
        workspace_id: workspaceId,
        goal_id: goalId,
        amount: parseBRL(formData.get("amount") as string),
        date: formData.get("date") as string,
      });
      setToast("Progresso salvo!");
      form.reset();
      (form.querySelector("#gc-date") as HTMLInputElement).value = today;
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-6 w-full max-w-full lg:max-w-none">
      <h4 className="font-bold text-foreground mb-4 sm:mb-6 text-sm sm:text-base">Poupar para meta</h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">
            Data
          </label>
          <input
            id="gc-date"
            type="date"
            name="date"
            required
            defaultValue={today}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
          />
        </div>
        <select
          name="goal_id"
          required
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-primary"
        >
          <option value="">Selecione a meta</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        {suggestedMonthly != null && (
          <p className="text-xs text-muted-foreground">
            Sugestão: {formatCurrency(suggestedMonthly, locale)}/mês para atingir no prazo
          </p>
        )}
        <input
          type="text"
          inputMode="decimal"
          name="amount"
          required
          placeholder={suggestedMonthly != null ? formatCurrency(suggestedMonthly, locale) : "Valor (Ex: 500 ou 1.500,50)"}
          className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
        />
        {toast && (
          <p className={`text-sm font-medium ${toast.includes("!") ? "text-emerald-600" : "text-rose-600"}`}>
            {toast}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || goals.length === 0}
          className="w-full min-h-[44px] bg-hero-gradient text-primary-foreground font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          {loading ? "Salvando..." : "Poupar p/ meta"}
        </button>
      </form>
    </div>
  );
}
