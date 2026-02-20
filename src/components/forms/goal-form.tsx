"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, AlertCircle } from "lucide-react";
import { createGoal, updateGoal } from "@/actions/goals";
import { parseBRL } from "@/lib/utils/currency";

type GoalForEdit = {
  id: string;
  title: string;
  target_amount: number;
  deadline: string | null;
};

export function GoalForm({
  workspaceId,
  goal,
  onEditSuccess,
  onCreateSuccess,
}: {
  workspaceId: string;
  goal?: GoalForEdit;
  onEditSuccess?: () => void;
  onCreateSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const isEdit = !!goal;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title") as string;
    const target_amount = parseBRL(formData.get("target_amount") as string);
    const deadlineRaw = formData.get("deadline") as string;
    const deadline = deadlineRaw && deadlineRaw.trim() ? deadlineRaw : undefined;
    try {
      if (isEdit) {
        await updateGoal(goal.id, workspaceId, { title, target_amount, deadline });
        setToast("Meta atualizada!");
        if (onEditSuccess) onEditSuccess();
        router.refresh();
      } else {
        await createGoal({
          workspace_id: workspaceId,
          title,
          target_amount,
          deadline,
        });
        setToast("Meta criada!");
        form.reset();
        (form.querySelector("#goal-deadline") as HTMLInputElement).value = "";
        if (onCreateSuccess) onCreateSuccess();
        router.refresh();
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const defaultTitle = isEdit ? goal.title : "";
  const defaultTarget = isEdit ? (goal.target_amount / 100).toFixed(2) : "";
  const defaultDeadline = isEdit && goal.deadline ? goal.deadline : "";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-6 w-full max-w-full lg:max-w-none">
      <div className="flex items-center gap-2 mb-6">
        {!isEdit && <Plus className="text-primary" size={20} />}
        <h2 className="text-lg font-bold text-foreground">
          {isEdit ? "Editar meta" : "Nova meta"}
        </h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Nome
          </label>
          <input
            type="text"
            name="title"
            required
            placeholder="Ex: Viagem de Férias"
            defaultValue={defaultTitle}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Valor alvo (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            name="target_amount"
            required
            placeholder="0,00"
            defaultValue={defaultTarget}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Data limite
          </label>
          <input
            id="goal-deadline"
            type="date"
            name="deadline"
            defaultValue={defaultDeadline}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
          />
        </div>
        {toast && (
          <p className={`text-sm font-medium ${toast.includes("!") || toast === "Meta atualizada!" ? "text-emerald-600" : "text-rose-600"}`}>
            {toast}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-md transition-all disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {loading ? (isEdit ? "Atualizando..." : "Criando...") : isEdit ? "Atualizar" : "Criar meta"}
        </button>
      </form>
      {!isEdit && (
        <div className="mt-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 flex gap-3">
          <AlertCircle className="text-blue-600 shrink-0" size={20} />
          <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
            O sistema calcula o valor mensal necessário com base na data escolhida.
          </p>
        </div>
      )}
    </div>
  );
}
