"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createInvestment, updateInvestment } from "@/actions/investments";
import { parseBRL } from "@/lib/utils/currency";

type InvestmentForEdit = {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: string;
};

export function InvestmentForm({
  workspaceId,
  investment,
  onEditSuccess,
}: {
  workspaceId: string;
  investment?: InvestmentForEdit;
  onEditSuccess?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!investment;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      workspace_id: workspaceId,
      name: formData.get("name") as string,
      amount: parseBRL(formData.get("amount") as string),
      date: formData.get("date") as string,
      type: (formData.get("type") as string) || undefined,
    };
    try {
      if (isEdit) {
        await updateInvestment(investment.id, workspaceId, payload);
        setToast("Atualizado!");
        if (onEditSuccess) {
          onEditSuccess();
        } else {
          router.refresh();
        }
        router.refresh();
      } else {
        await createInvestment(payload);
        setToast("Investimento registrado!");
        form.reset();
        (form.querySelector("#inv-date") as HTMLInputElement).value = today;
        router.refresh();
      }
    } catch (err) {
      setToast(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  const defaultDate = isEdit ? investment.date : today;
  const defaultName = isEdit ? investment.name : "";
  const defaultAmount = isEdit ? (investment.amount / 100).toFixed(2) : "";
  const defaultType = isEdit ? investment.type : "outro";

  return (
    <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-6 w-full max-w-full lg:max-w-none">
      <h4 className="font-bold text-foreground mb-4 sm:mb-6 text-sm sm:text-base flex items-center gap-2">
        {!isEdit && <Plus size={20} className="text-primary" />}
        {isEdit ? "Editar investimento" : "Novo Aporte"}
      </h4>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Data
          </label>
          <input
            id="inv-date"
            type="date"
            name="date"
            required
            defaultValue={defaultDate}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Nome do ativo
          </label>
          <input
            type="text"
            name="name"
            required
            placeholder="Ex: CDB Liquidez Diária"
            defaultValue={defaultName}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Categoria
          </label>
          <select
            name="type"
            defaultValue={defaultType}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground text-sm transition-all"
          >
            <option value="outro">Outro</option>
            <option value="cdb">CDB</option>
            <option value="lci">LCI</option>
            <option value="lca">LCA</option>
            <option value="tesouro">Tesouro</option>
            <option value="acao">Ação</option>
            <option value="fii">FII</option>
            <option value="crypto">Cripto</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Valor (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            name="amount"
            required
            placeholder="0,00"
            defaultValue={defaultAmount}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground placeholder:text-muted-foreground text-sm font-bold text-primary transition-all"
          />
        </div>
        {toast && (
          <p className={`text-sm font-medium ${toast.includes("!") || toast === "Atualizado!" ? "text-emerald-600" : "text-rose-600"}`}>
            {toast}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-70 active:scale-[0.98]"
        >
          {loading ? (isEdit ? "Atualizando..." : "Salvando...") : isEdit ? "Atualizar" : "Confirmar Aporte"}
        </button>
      </form>
    </div>
  );
}
