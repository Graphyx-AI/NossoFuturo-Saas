"use client";

import { Link } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import type { BudgetWithUsage } from "@/actions/budgets";
import { AlertTriangle } from "lucide-react";

export function BudgetAlertsCard({
  alerts,
  locale,
}: {
  alerts: BudgetWithUsage[];
  locale: string;
}) {
  if (alerts.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-amber-600" />
        <h3 className="font-bold text-foreground text-sm">
          Alertas de orçamento
        </h3>
      </div>
      <ul className="space-y-2 text-sm">
        {alerts.map((b) => {
          const pct = b.limit_amount > 0 ? Math.round((b.used_amount / b.limit_amount) * 100) : 0;
          const isOver = b.used_amount > b.limit_amount;
          return (
            <li key={b.id} className="flex justify-between items-center">
              <span>
                {b.category_icon} {b.category_name} — {pct}%
              </span>
              <span className={isOver ? "text-rose-600 font-semibold" : "text-amber-600"}>
                {formatCurrency(b.used_amount, locale)} / {formatCurrency(b.limit_amount, locale)}
              </span>
            </li>
          );
        })}
      </ul>
      <Link
        href="/dashboard/budgets"
        className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
      >
        Ver orçamentos →
      </Link>
    </div>
  );
}
