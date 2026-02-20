"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTransaction, updateTransaction } from "@/actions/transactions";
import { parseBRL } from "@/lib/utils/currency";
import type { Category } from "@/types/database";

type TransactionForEdit = {
  id: string;
  category_id: string | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  date: string;
};

export function TransactionForm({
  workspaceId,
  year,
  month,
  incomeCategories,
  expenseCategories,
  defaultDate,
  transaction,
  onEditSuccess,
}: {
  workspaceId: string;
  year: number;
  month: number;
  incomeCategories: Category[];
  expenseCategories: Category[];
  defaultDate: string;
  transaction?: TransactionForEdit;
  onEditSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const isEdit = !!transaction;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const categoryId = formData.get("category_id") as string;
    const type = formData.get("type") as "income" | "expense" | "transfer";
    const amount = parseBRL(formData.get("amount") as string);
    const payload = {
      workspace_id: workspaceId,
      category_id: categoryId && categoryId.length > 0 ? categoryId : null,
      type: type as "income" | "expense",
      amount,
      description,
      date,
    };
    try {
      if (isEdit) {
        await updateTransaction(transaction!.id, workspaceId, {
          ...payload,
          type: type as "income" | "expense" | "transfer",
        });
        setToast("Atualizado!");
        if (onEditSuccess) {
          onEditSuccess();
        } else {
          router.push(`/dashboard/transactions?year=${year}&month=${month}`);
        }
        router.refresh();
      } else {
        await createTransaction(payload);
        setToast("Salvo!");
        form.reset();
        (form.querySelector("#date") as HTMLInputElement).value = defaultDate;
        router.refresh();
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  const defaultAmount = isEdit ? (transaction!.amount / 100).toFixed(2) : "";
  const defaultType = isEdit
    ? (transaction!.type === "transfer" ? "expense" : transaction!.type)
    : "expense";
  const defaultCategoryId = isEdit ? (transaction!.category_id ?? "") : "";
  const defaultDesc = isEdit ? transaction!.description : "";
  const defaultDateVal = isEdit ? transaction!.date : defaultDate;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-8 w-full max-w-full lg:max-w-none">
      <h4 className="font-bold text-foreground mb-4 sm:mb-6 text-sm sm:text-base">
        {isEdit ? "Editar transação" : "Nova transação"}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">
            Data
          </label>
          <input
            id="date"
            type="date"
            name="date"
            required
            defaultValue={defaultDateVal}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">
            Descrição
          </label>
          <input
            type="text"
            name="description"
            required
            placeholder="Ex: Supermercado"
            defaultValue={defaultDesc}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1 block mb-1">
            Categoria
          </label>
          <select
            name="category_id"
            defaultValue={defaultCategoryId}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium text-foreground"
          >
            <optgroup label="Despesas">
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </optgroup>
            <optgroup label="Receitas">
              {incomeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            inputMode="decimal"
            name="amount"
            required
            placeholder="Valor (Ex: 5.000 ou 50,99)"
            defaultValue={defaultAmount}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground"
          />
          <select
            name="type"
            defaultValue={defaultType}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-bold text-foreground"
          >
            <option value="expense">Saída</option>
            <option value="income">Entrada</option>
          </select>
        </div>
        {toast && (
          <p
            className={`text-sm font-medium ${
              toast === "Salvo!" || toast === "Atualizado!" ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {toast}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-[44px] bg-hero-gradient text-primary-foreground font-semibold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-70"
        >
          {loading ? (isEdit ? "Atualizando..." : "Salvando...") : isEdit ? "Atualizar" : "Salvar"}
        </button>
      </form>
    </div>
  );
}
