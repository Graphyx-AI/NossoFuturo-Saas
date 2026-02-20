"use client";

import { useCallback, useState } from "react";
import { Download, Printer, MessageCircle, Check } from "lucide-react";
import { formatBRL } from "@/lib/utils/currency";
import type { ReceivableRow } from "@/actions/receivables";

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "--";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR");
}

function buildWhatsAppText(receivables: ReceivableRow[]): string {
  const lines = ["*Cobranças pendentes:*", ""];
  let total = 0;
  for (const r of receivables) {
    if (r.status === "paid") continue;
    lines.push(`• ${r.debtor_name}: ${formatBRL(r.amount)}${r.due_date ? ` (venc: ${formatDateBR(r.due_date)})` : ""}`);
    total += r.amount;
  }
  if (total > 0) {
    lines.push("");
    lines.push(`Total: ${formatBRL(total)}`);
  }
  return lines.join("\n");
}

export function CobrancasExportButtons({
  receivables,
  queryString,
}: {
  receivables: ReceivableRow[];
  queryString: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyWhatsApp = useCallback(async () => {
    const text = buildWhatsAppText(receivables);
    if (!text.trim() || text === "*Cobranças pendentes:*\n\n") {
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [receivables]);

  const exportCsvUrl = `/api/cobrancas/export-csv${queryString ? `?${queryString}` : ""}`;
  const pendingCount = receivables.filter((r) => r.status !== "paid").length;

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden">
      <a
        href={exportCsvUrl}
        download
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium bg-card hover:bg-secondary/50 transition-all shadow-sm"
      >
        <Download size={16} /> Exportar CSV
      </a>
      <button
        type="button"
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium bg-card hover:bg-secondary/50 transition-all shadow-sm"
      >
        <Printer size={16} /> Exportar PDF
      </button>
      <button
        type="button"
        onClick={handleCopyWhatsApp}
        disabled={pendingCount === 0}
        title="Copiar texto para colar no WhatsApp"
        className="flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-medium bg-card hover:bg-secondary/50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {copied ? <Check size={16} className="text-green-600" /> : <MessageCircle size={16} />}
        {copied ? "Copiado!" : "Copiar p/ WhatsApp"}
      </button>
    </div>
  );
}
