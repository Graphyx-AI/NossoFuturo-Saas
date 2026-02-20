"use client";

import { useState } from "react";
import { createGoalContribution } from "@/actions/goals";
import { parseBRL } from "@/lib/utils/currency";
import type { Goal } from "@/types/database";

export function GoalContributionForm({
  workspaceId,
  goals,
}: {
  workspaceId: string;
  goals: Goal[];
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

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
          className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-primary"
        >
          <option value="">Selecione a meta</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.title}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="decimal"
          name="amount"
          required
          placeholder="Valor (Ex: 500 ou 1.500,50)"
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
