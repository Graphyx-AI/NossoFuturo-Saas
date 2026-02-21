"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Command } from "cmdk";
import {
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Receipt,
  Target,
  PiggyBank,
  Repeat,
  FileText,
  Settings,
  Plus,
} from "lucide-react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50" onClick={() => setOpen(false)}>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Menu de comandos"
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          placeholder="Buscar ou executar..."
          className="w-full px-4 py-3 bg-transparent border-b border-border outline-none text-foreground placeholder:text-muted-foreground"
        />
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">Nenhum resultado.</Command.Empty>
          <Command.Group heading="Navegação">
            <Command.Item
              onSelect={() => { router.push("/dashboard"); setOpen(false); }}
              className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary"
            >
              <LayoutDashboard className="h-4 w-4" />
              Visão geral
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/transactions"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <ArrowLeftRight className="h-4 w-4" />
              Transações
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/investments"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <TrendingUp className="h-4 w-4" />
              Investimentos
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/cobrancas"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <Receipt className="h-4 w-4" />
              Cobranças
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/goals"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <Target className="h-4 w-4" />
              Metas
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/budgets"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <PiggyBank className="h-4 w-4" />
              Orçamentos
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/recurring"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <Repeat className="h-4 w-4" />
              Recorrentes
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/reports"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <FileText className="h-4 w-4" />
              Relatórios
            </Command.Item>
          </Command.Group>
          <Command.Group heading="Ações">
            <Command.Item onSelect={() => { router.push("/dashboard/transactions"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <Plus className="h-4 w-4" />
              Nova transação
            </Command.Item>
            <Command.Item onSelect={() => { router.push("/dashboard/goals"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <Plus className="h-4 w-4" />
              Nova meta
            </Command.Item>
          </Command.Group>
          <Command.Group heading="Sistema">
            <Command.Item onSelect={() => { router.push("/dashboard/settings"); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer data-[selected]:bg-secondary">
              <Settings className="h-4 w-4" />
              Configurações
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </div>
  );
}
