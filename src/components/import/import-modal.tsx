"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, Upload } from "lucide-react";
import { importTransactions, type ImportRow } from "@/actions/import-transactions";
import type { Category } from "@/types/database";

function parseBRL(s: string): number {
  const n = s.replace(/[^\d,.-]/g, "").replace(",", ".");
  return parseFloat(n) || 0;
}

function parseDate(s: string): string {
  const d = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const m = d.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const m2 = d.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return d;
  return "";
}

export function ImportModal({
  workspaceId,
  onClose,
}: {
  workspaceId: string;
  expenseCategories?: Category[];
  incomeCategories?: Category[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [dateCol, setDateCol] = useState(0);
  const [descCol, setDescCol] = useState(1);
  const [amountCol, setAmountCol] = useState(2);
  const [typeCol, setTypeCol] = useState(-1);

  function parseRows(rows: string[][]) {
    return rows.slice(0, 200).map((row) => {
      const date = parseDate(row[dateCol] ?? "");
      const amount = parseBRL(row[amountCol] ?? "0");
      const typeVal = typeCol >= 0 ? (row[typeCol] ?? "").toLowerCase() : "";
      const isIncome = typeVal.includes("entrada") || typeVal.includes("credit") || typeVal.includes("+") || (amount !== 0 && amount > 0);
      return {
        date: date || new Date().toISOString().slice(0, 10),
        description: (row[descCol] ?? "").trim() || "Importado",
        amount: Math.abs(amount),
        type: isIncome ? "income" : "expense",
      } as ImportRow;
    }).filter((r) => r.amount > 0);
  }

  useEffect(() => {
    if (rawRows.length > 0) setPreview(parseRows(rawRows));
  }, [rawRows, dateCol, descCol, amountCol, typeCol]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const formData = new FormData();
    formData.append("file", f);
    const res = await fetch("/api/import/parse", { method: "POST", body: formData });
    const data = await res.json();
    if (data.rows?.length) {
      setRawRows(data.rows as string[][]);
    } else {
      setRawRows([]);
      setPreview([]);
    }
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setLoading(true);
    const result = await importTransactions(workspaceId, preview);
    setLoading(false);
    if (result.ok) {
      alert(`Importadas ${result.imported} transações. Ignoradas: ${result.skipped}`);
      onClose();
      router.refresh();
    } else {
      alert(result.error);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold text-foreground">Importar extrato CSV</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">Arquivo CSV</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm"
            />
          </label>
          {preview.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Preview: {preview.length} linhas. Ajuste as colunas se necessário.
              </p>
              <div className="grid grid-cols-4 gap-2 text-xs">
                <label>
                  Col. Data <input type="number" min={0} value={dateCol} onChange={(e) => setDateCol(parseInt(e.target.value, 10) || 0)} className="w-12 border rounded px-1" />
                </label>
                <label>
                  Col. Desc. <input type="number" min={0} value={descCol} onChange={(e) => setDescCol(parseInt(e.target.value, 10) || 0)} className="w-12 border rounded px-1" />
                </label>
                <label>
                  Col. Valor <input type="number" min={0} value={amountCol} onChange={(e) => setAmountCol(parseInt(e.target.value, 10) || 0)} className="w-12 border rounded px-1" />
                </label>
                <label>
                  Col. Tipo (opc.) <input type="number" min={-1} value={typeCol} onChange={(e) => setTypeCol(parseInt(e.target.value, 10) ?? -1)} className="w-12 border rounded px-1" />
                </label>
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 text-xs">
                {preview.slice(0, 10).map((r, i) => (
                  <div key={i} className="flex justify-between py-1">
                    <span>{r.date}</span>
                    <span className="truncate max-w-[120px]">{r.description}</span>
                    <span>{r.type === "income" ? "+" : "-"} {(r.amount / 100).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || preview.length === 0}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-hero-gradient px-4 py-2.5 font-semibold text-primary-foreground disabled:opacity-70"
          >
            <Upload className="h-4 w-4" />
            {loading ? "Importando..." : `Importar ${preview.length} transações`}
          </button>
        </div>
      </div>
    </div>
  );
}
