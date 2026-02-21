"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { ImportModal } from "./import-modal";
import type { Category } from "@/types/database";

export function ImportButtonWithModal({
  workspaceId,
  expenseCategories,
  incomeCategories,
}: {
  workspaceId: string;
  expenseCategories: Category[];
  incomeCategories: Category[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
      >
        <Upload className="h-4 w-4" />
        Importar extrato
      </button>
      {open && (
        <ImportModal
          workspaceId={workspaceId}
          expenseCategories={expenseCategories}
          incomeCategories={incomeCategories}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
