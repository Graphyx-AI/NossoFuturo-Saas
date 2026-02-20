"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createReceivable, updateReceivable } from "@/actions/receivables";
import { parseBRL } from "@/lib/utils/currency";
import type { ReceivableRow } from "@/actions/receivables";

export function ReceivableForm({
  workspaceId,
  receivable,
  onEditSuccess,
}: {
  workspaceId: string;
  receivable?: ReceivableRow;
  onEditSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const isEdit = !!receivable;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const amount = parseBRL(formData.get("amount") as string);
    const payload = {
      workspace_id: workspaceId,
      debtor_name: (formData.get("debtor_name") as string).trim(),
      amount,
      due_date: (formData.get("due_date") as string) || null,
      status: (formData.get("status") as "pending" | "paid" | "overdue") || "pending",
      phone: (formData.get("phone") as string)?.trim() || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };
    try {
      if (isEdit) {
        await updateReceivable(receivable.id, workspaceId, payload);
        setToast("Cobrança atualizada!");
        onEditSuccess?.();
        router.refresh();
      } else {
        await createReceivable(payload);
        setToast("Cobrança adicionada!");
        form.reset();
        router.refresh();
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-6 w-full max-w-full lg:max-w-none">
      <h4 className="font-bold text-foreground mb-4 sm:mb-6 text-sm sm:text-base flex items-center gap-2">
        {!isEdit && <Plus size={20} className="text-primary" />}
        {isEdit ? "Editar cobrança" : "Nova cobrança"}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="debtor_name" className="block text-sm font-medium text-foreground mb-1">
            Quem deve *
          </label>
          <input
            id="debtor_name"
            name="debtor_name"
            type="text"
            required
            defaultValue={receivable?.debtor_name}
            placeholder="Nome da pessoa"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-1">
            Valor (R$) *
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            required
            defaultValue={receivable ? (receivable.amount / 100).toFixed(2) : ""}
            placeholder="0,00"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="due_date" className="block text-sm font-medium text-foreground mb-1">
            Vencimento
          </label>
          <input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={receivable?.due_date ?? ""}
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        {isEdit && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={receivable.status}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="pending">Pendente</option>
              <option value="overdue">Atrasado</option>
              <option value="paid">Pago</option>
            </select>
          </div>
        )}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
            Telefone (WhatsApp)
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={receivable?.phone ?? ""}
            placeholder="11999999999"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-foreground mb-1">
            Observações
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={receivable?.notes ?? ""}
            placeholder="Detalhes opcionais"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
        {toast && (
          <p className={`text-sm ${toast.startsWith("Erro") ? "text-destructive" : "text-primary"}`}>
            {toast}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Salvando…" : isEdit ? "Atualizar" : "Adicionar cobrança"}
        </button>
      </form>
    </div>
  );
}
