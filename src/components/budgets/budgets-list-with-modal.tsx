"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { updateBudget, deleteBudget, type BudgetWithUsage } from "@/actions/budgets";
import { formatCurrency } from "@/lib/utils/currency";
import { parseBRL } from "@/lib/utils/currency";
import { Pencil, Trash2 } from "lucide-react";

export function BudgetsListWithModal({
  budgets,
  workspaceId,
  locale,
}: {
  budgets: BudgetWithUsage[];
  workspaceId: string;
  locale: string;
}) {
  const router = useRouter();
  const t = useTranslations("forms.budget");
  const tCommon = useTranslations("common");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(b: BudgetWithUsage) {
    setEditingId(b.id);
    setEditAmount((b.limit_amount / 100).toFixed(2).replace(".", ","));
  }

  async function saveEdit(id: string) {
    const parsed = parseBRL(editAmount);
    if (isNaN(parsed) || parsed <= 0) return;
    await updateBudget(id, workspaceId, { limit_amount: parsed });
    setEditingId(null);
    router.refresh();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteBudget(id, workspaceId);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <ul className="divide-y divide-border">
      {budgets.map((b) => {
        const pct = b.limit_amount > 0 ? Math.min((b.used_amount / b.limit_amount) * 100, 150) : 0;
        const isOver = b.used_amount > b.limit_amount;
        const isWarning = pct >= 80 && !isOver;
        const isEditing = editingId === b.id;

        return (
          <li
            key={b.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-secondary/30"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl" aria-hidden>{b.category_icon}</span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{b.category_name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(b.used_amount, locale)} / {formatCurrency(b.limit_amount, locale)}
                </p>
                <div className="mt-1 h-2 bg-secondary rounded-full overflow-hidden max-w-[200px]">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-primary"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-28 rounded-lg border border-border px-2 py-1 text-sm"
                    placeholder="0,00"
                  />
                  <button
                    type="button"
                    onClick={() => saveEdit(b.id)}
                    className="rounded-lg bg-primary px-3 py-1 text-sm font-medium text-primary-foreground"
                  >
                    {tCommon("save")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="rounded-lg border border-border px-3 py-1 text-sm"
                  >
                    {tCommon("cancel")}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => startEdit(b)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-secondary"
                    aria-label={tCommon("edit")}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b.id)}
                    disabled={deletingId === b.id}
                    className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 disabled:opacity-50"
                    aria-label={tCommon("delete")}
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
