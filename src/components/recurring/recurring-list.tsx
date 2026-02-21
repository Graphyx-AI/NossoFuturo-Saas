"use client";

import { useRouter } from "next/navigation";
import { deleteRecurring, type RecurringTransaction } from "@/actions/recurring";
import { formatCurrency } from "@/lib/utils/currency";
import { Trash2 } from "lucide-react";

export function RecurringList({
  recurrings,
  workspaceId,
  locale,
  freqLabels,
}: {
  recurrings: RecurringTransaction[];
  workspaceId: string;
  locale: string;
  freqLabels: Record<string, string>;
}) {
  const router = useRouter();

  async function handleDelete(id: string) {
    await deleteRecurring(id, workspaceId);
    router.refresh();
  }

  return (
    <ul className="divide-y divide-border">
      {recurrings.map((r) => (
        <li
          key={r.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-secondary/30"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl shrink-0" aria-hidden>
              {r.category_icon ?? (r.type === "income" ? "💰" : "💸")}
            </span>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{r.description}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(r.amount, locale)} • {freqLabels[r.frequency] ?? r.frequency} • Próximo: {r.next_run_date}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(r.id)}
            className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 shrink-0"
            aria-label="Excluir"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}
