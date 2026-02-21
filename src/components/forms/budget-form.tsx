"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createBudget } from "@/actions/budgets";
import { parseBRL } from "@/lib/utils/currency";
import type { Category } from "@/types/database";

export function BudgetForm({
  workspaceId,
  expenseCategories,
  year,
  month,
  existingBudgetCategoryIds = [],
}: {
  workspaceId: string;
  expenseCategories: Category[];
  year: number;
  month: number;
  existingBudgetCategoryIds?: string[];
}) {
  const router = useRouter();
  const t = useTranslations("forms.budget");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [limitAmount, setLimitAmount] = useState("");

  const categoriesWithoutBudget = expenseCategories.filter(
    (c) => !existingBudgetCategoryIds.includes(c.id)
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = parseBRL(limitAmount);
    if (!categoryId || !limitAmount || isNaN(parsed) || parsed <= 0) {
      setError(t("invalidData"));
      return;
    }
    setLoading(true);
    const result = await createBudget({
      workspace_id: workspaceId,
      category_id: categoryId,
      year,
      month,
      limit_amount: parsed,
    });
    setLoading(false);
    if (result.ok) {
      setCategoryId("");
      setLimitAmount("");
      router.refresh();
    } else {
      setError(result.error ?? t("error"));
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-foreground">{t("category")}</span>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
          required
        >
          <option value="">{t("selectCategory")}</option>
          {categoriesWithoutBudget.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-sm font-medium text-foreground">{t("limitAmount")}</span>
        <input
          type="text"
          inputMode="decimal"
          value={limitAmount}
          onChange={(e) => setLimitAmount(e.target.value)}
          placeholder="0,00"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5"
          required
        />
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full inline-flex items-center justify-center rounded-xl bg-hero-gradient px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-70"
      >
        {loading ? t("saving") : t("add")}
      </button>
    </form>
  );
}
