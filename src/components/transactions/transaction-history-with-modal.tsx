"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/dates";
import { TransactionForm } from "@/components/forms/transaction-form";
import { deleteTransaction } from "@/actions/transactions";
import type { Category } from "@/types/database";

type TransactionRow = {
  id: string;
  category_id: string | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  description: string;
  date: string;
  category?: { name?: string };
};

export function TransactionHistoryWithModal({
  transactions,
  incomeCategories,
  expenseCategories,
  workspaceId,
  year,
  month,
  defaultDate,
}: {
  transactions: TransactionRow[];
  incomeCategories: Category[];
  expenseCategories: Category[];
  workspaceId: string;
  year: number;
  month: number;
  defaultDate: string;
}) {
  const [editingTransaction, setEditingTransaction] = useState<TransactionRow | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");

  const handleEditSuccess = () => {
    setEditingTransaction(null);
    router.refresh();
  };

  return (
    <>
      <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
        <div className="px-4 sm:px-8 py-4 sm:py-6 bg-secondary/50 border-b border-border">
          <h4 className="font-bold text-foreground text-sm sm:text-base">{t("historyTitle")}</h4>
        </div>

        {/* Mobile: cards empilhados */}
        <div className="md:hidden divide-y divide-border">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground italic text-sm">
              {t("noTransactions")}
            </div>
          ) : (
            transactions.map((tr) => (
              <div key={tr.id} className="p-4 flex flex-col gap-1">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">
                      {tr.category?.name ?? t("noCategory")}
                    </span>
                    <p className="text-sm font-bold text-foreground truncate">{tr.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tr.date, locale)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className={`text-sm font-bold ${
                        tr.type === "income" ? "text-emerald-500" : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(tr.amount, locale)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingTransaction(tr)}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary transition-colors"
                      title={tCommon("edit")}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <form action={deleteTransaction.bind(null, tr.id, workspaceId)}>
                      <button
                        type="submit"
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-rose-500 transition-colors"
                        title={tCommon("delete")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop: tabela */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-[10px] font-black text-muted-foreground uppercase bg-secondary/30">
              <tr>
                <th className="px-4 lg:px-8 py-4">{t("date")}</th>
                <th className="px-4 lg:px-8 py-4">{t("categoryDescription")}</th>
                <th className="px-4 lg:px-8 py-4 text-right">{t("value")}</th>
                <th className="px-4 lg:px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((trx) => (
                <tr key={trx.id} className="group hover:bg-secondary/50">
                  <td className="px-4 lg:px-8 py-4 text-xs font-bold text-muted-foreground">
                    {formatDate(trx.date, locale)}
                  </td>
                  <td className="px-4 lg:px-8 py-4">
                    <span className="block text-[9px] font-black text-muted-foreground uppercase tracking-tighter">
                      {trx.category?.name ?? t("noCategory")}
                    </span>
                    <span className="text-sm font-bold text-foreground">{trx.description}</span>
                  </td>
                  <td
                    className={`px-4 lg:px-8 py-4 text-right font-black ${
                      trx.type === "income" ? "text-emerald-500" : "text-rose-500"
                    }`}
                  >
                    {formatCurrency(trx.amount, locale)}
                  </td>
                  <td className="px-4 lg:px-8 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingTransaction(trx)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-primary transition-colors"
                        title={tCommon("edit")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <form action={deleteTransaction.bind(null, trx.id, workspaceId)} className="inline">
                        <button
                          type="submit"
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-rose-500 transition-colors"
                          title={tCommon("delete")}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {transactions.length === 0 && (
            <div className="p-20 text-center text-muted-foreground italic">
              {t("noTransactions")}
            </div>
          )}
        </div>
      </div>

      {/* Modal de edição */}
      {editingTransaction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setEditingTransaction(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl shadow-card w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
              <h3 id="modal-title" className="font-bold text-foreground text-sm sm:text-base">
                Editar transação
              </h3>
              <button
                type="button"
                onClick={() => setEditingTransaction(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:text-foreground transition-colors"
                title="Fechar"
                aria-label="Fechar"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <TransactionForm
                workspaceId={workspaceId}
                year={year}
                month={month}
                incomeCategories={incomeCategories}
                expenseCategories={expenseCategories}
                defaultDate={defaultDate}
                transaction={{
                  id: editingTransaction.id,
                  category_id: editingTransaction.category_id,
                  type: editingTransaction.type,
                  amount: editingTransaction.amount,
                  description: editingTransaction.description,
                  date: editingTransaction.date,
                }}
                onEditSuccess={handleEditSuccess}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
