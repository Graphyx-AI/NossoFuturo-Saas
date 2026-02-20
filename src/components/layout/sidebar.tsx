"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";
import {
  Heart,
  X,
  LayoutDashboard,
  ArrowLeftRight,
  TrendingUp,
  Target,
  FileText,
  Briefcase,
  Settings,
  LogOut,
  Moon,
  Sun,
  } from "lucide-react";
import { useEffect } from "react";

const menuStructure = [
  {
    groupKey: "main",
    items: [
      { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, dataTour: "nav-overview" },
      { href: "/dashboard/transactions", labelKey: "transactions", icon: ArrowLeftRight, dataTour: "nav-transactions" },
      { href: "/dashboard/investments", labelKey: "investments", icon: TrendingUp, dataTour: "nav-investments" },
      { href: "/dashboard/cobrancas", labelKey: "cobrancas", icon: ArrowLeftRight, dataTour: "nav-cobrancas" },
      { href: "/dashboard/goals", labelKey: "goals", icon: Target, dataTour: "nav-goals" },
      { href: "/dashboard/reports", labelKey: "reports", icon: FileText, dataTour: "nav-reports" },
    ],
  },
  {
    groupKey: "system",
    items: [
      { href: "/dashboard/workspace", labelKey: "workspace", icon: Briefcase, dataTour: "nav-workspace" },
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings, dataTour: "nav-settings" },
    ],
  },
] as const;

export function Sidebar({
  mobileOpen = false,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  // Fecha o menu ao navegar (pathname muda); não fechar quando mobileOpen vira true
  useEffect(() => {
    if (mobileOpen && onClose) onClose();
  }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const navContent = (
    <>
      {/* Logo / Branding */}
      <div className="p-8 flex items-center justify-between gap-2 shrink-0">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-primary font-bold text-2xl tracking-tight"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-sm">
            <Heart size={24} fill="currentColor" className="text-primary" />
          </div>
          <span className="text-gradient-hero whitespace-nowrap">{tCommon("brand")}</span>
        </Link>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary transition-colors shrink-0"
            aria-label={t("closeMenu")}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navegação Principal (grupos) */}
      <nav
        className="flex-1 px-4 overflow-y-auto custom-scrollbar"
        data-tour="sidebar"
      >
        {menuStructure.map((group, idx) => (
          <div key={idx} className="mb-8">
            <h3 className="px-4 text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3">
              {t(group.groupKey)}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-tour={item.dataTour}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${isActive
                      ? "bg-primary/10 text-primary font-bold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                  >
                    <Icon
                      size={20}
                      className={
                        isActive
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground transition-colors"
                      }
                    />
                    <span className="text-sm">{t(item.labelKey)}</span>
                    {isActive && (
                      <div className="ml-auto">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Rodapé da Sidebar (tema + sair) */}
      <div className="p-4 mt-auto border-t border-border space-y-1 shrink-0">
        <button
          type="button"
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-secondary transition-all group"
        >
          <div className="p-1.5 rounded-lg bg-secondary group-hover:bg-card transition-colors">
            {theme === "dark" ? (
              <Sun size={18} className="text-amber-500" />
            ) : (
              <Moon size={18} className="text-muted-foreground" />
            )}
          </div>
          <span className="text-sm font-medium">
            {theme === "dark" ? t("lightMode") : t("darkMode")}
          </span>
        </button>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all group"
        >
          <LogOut size={20} className="group-hover:translate-x-0.5 transition-transform shrink-0" />
          <span className="text-sm font-medium">{t("signOut")}</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: sidebar fixa (lg+) */}
      <aside
        className="hidden lg:flex print:hidden w-64 min-h-screen bg-card border-r border-border flex-col fixed left-0 top-0 z-30 h-screen sticky top-0 transition-colors"
        data-tour="sidebar"
      >
        {navContent}
      </aside>

      {/* Mobile: overlay */}
      {onClose && (
        <div
          role="button"
          tabIndex={-1}
          aria-hidden={!mobileOpen}
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose()}
          className={`lg:hidden print:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
        />
      )}

      {/* Mobile: sheet (painel deslizante) */}
      <aside
        aria-modal="true"
        aria-hidden={!mobileOpen}
        className={`lg:hidden print:hidden fixed top-0 left-0 z-50 w-72 max-w-[85vw] h-full bg-card border-r border-border flex flex-col shadow-xl transition-transform duration-200 ease-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {navContent}
      </aside>
    </>
  );
}
