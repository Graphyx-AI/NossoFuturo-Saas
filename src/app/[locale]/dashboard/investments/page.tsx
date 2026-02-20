import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { Link } from "@/i18n/navigation";
import {
  getWorkspaceById,
  getWorkspacesForUser,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import {
  getMonthlyInvestments,
  getYearlyInvestments,
  getInvestmentsByDateRange,
} from "@/actions/investments";
import { formatCurrency } from "@/lib/utils/currency";
import { InvestmentForm } from "@/components/forms/investment-form";
import { InvestmentHistoryWithModal } from "@/components/investments/investment-history-with-modal";
import { InvestmentFilter } from "@/components/investments/investment-filter";
import { InvestmentExportButtons } from "@/components/investments/investment-export-buttons";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { DollarSign, PieChart, Calendar } from "lucide-react";

const WORKSPACE_COOKIE = "workspace_id";
const MONTH_KEYS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;

function formatLastContributionDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type FilterMode = "year" | "month" | "range";

function getEndOfMonth(year: number, monthIndex: number): string {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; fromMonth?: string; toMonth?: string }>;
}) {
  const t = await getTranslations("investments");
  const tDashboard = await getTranslations("dashboard");
  const tMonths = await getTranslations("common.months");
  const locale = await getLocale();
  const params = await searchParams;
  const now = new Date();
  let year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  let month = params.month !== undefined ? parseInt(params.month, 10) : now.getMonth();
  const fromMonthParam = params.fromMonth !== undefined ? parseInt(params.fromMonth, 10) : 0;
  const toMonthParam = params.toMonth !== undefined ? parseInt(params.toMonth, 10) : 11;

  if (Number.isNaN(year) || year < 2020 || year > 2100) year = now.getFullYear();
  if (Number.isNaN(month) || month < 0 || month > 11) month = now.getMonth();

  let mode: FilterMode = "year";
  if (params.fromMonth !== undefined && params.toMonth !== undefined) {
    mode = "range";
  } else if (params.month !== undefined) {
    mode = "month";
  }

  let fromMonth = Number.isNaN(fromMonthParam) || fromMonthParam < 0 ? 0 : Math.min(11, fromMonthParam);
  let toMonth = Number.isNaN(toMonthParam) || toMonthParam > 11 ? 11 : Math.max(0, toMonthParam);
  if (mode === "range" && fromMonth > toMonth) {
    [fromMonth, toMonth] = [toMonth, fromMonth];
  }

  const cookieStore = await cookies();
  let workspaces = await getWorkspacesForUser();
  if (workspaces.length === 0) {
    await ensureDefaultWorkspace();
    workspaces = await getWorkspacesForUser();
  }
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const firstWorkspaceId = workspaces[0]?.id ?? null;
  const preferredWorkspaceId = workspaceId ?? firstWorkspaceId;
  const workspaceFromPreferred = await getWorkspaceById(preferredWorkspaceId);
  const workspace =
    workspaceFromPreferred ??
    (firstWorkspaceId && firstWorkspaceId !== preferredWorkspaceId
      ? await getWorkspaceById(firstWorkspaceId)
      : null);

  if (!workspace) {
    return (
      <div className="py-10 text-muted-foreground">{tDashboard("selectWorkspace")}</div>
    );
  }

  let investments: Awaited<ReturnType<typeof getMonthlyInvestments>>;
  let periodLabel: string;

  if (mode === "range") {
    const startDate = `${year}-${String(fromMonth + 1).padStart(2, "0")}-01`;
    const endDate = getEndOfMonth(year, toMonth);
    investments = await getInvestmentsByDateRange(workspace.id, startDate, endDate);
    periodLabel =
      fromMonth === toMonth
        ? `${tMonths(MONTH_KEYS[fromMonth])} ${year}`
        : `${tMonths(MONTH_KEYS[fromMonth])} a ${tMonths(MONTH_KEYS[toMonth])} ${year}`;
  } else if (mode === "month") {
    investments = await getMonthlyInvestments(workspace.id, year, month);
    periodLabel = `${tMonths(MONTH_KEYS[month])} ${year}`;
  } else {
    investments = await getYearlyInvestments(workspace.id, year);
    periodLabel = String(year);
  }

  const total = investments.reduce((a, b) => a + b.amount, 0);
  const lastInvestment = investments[0] ?? null;
  const lastContributionLabel = lastInvestment
    ? formatLastContributionDate(lastInvestment.date, locale)
    : t("none");

  const exportQuery = new URLSearchParams();
  exportQuery.set("year", String(year));
  if (mode === "month") exportQuery.set("month", String(month));
  if (mode === "range") {
    exportQuery.set("fromMonth", String(fromMonth));
    exportQuery.set("toMonth", String(toMonth));
  }
  const queryString = exportQuery.toString();

  return (
    <div className="space-y-8">
      <RealtimeRefresher
        workspaceId={workspace.id}
        options={{ investments: true }}
      />
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t("pageTitle")}</h2>
          <p className="text-muted-foreground text-sm sm:text-base mt-0.5">
            {t("pageSubtitle")}
          </p>
        </div>
        <InvestmentExportButtons queryString={queryString} />
      </header>

      <div className="bg-card border border-border rounded-2xl shadow-card px-4 py-3 print:hidden">
        <InvestmentFilter
          mode={mode}
          year={year}
          month={month}
          fromMonth={fromMonth}
          toMonth={toMonth}
        />
      </div>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <DollarSign size={20} />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">{t("totalInvested", { period: periodLabel })}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">
            {formatCurrency(total, locale)}
          </h3>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-600">
              <PieChart size={20} />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">{t("assetsInPeriod")}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">
            {investments.length} {investments.length === 1 ? t("asset") : t("assets")}
          </h3>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-600">
              <Calendar size={20} />
            </div>
          </div>
          <p className="text-muted-foreground text-sm font-medium">{t("lastContribution")}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1">{lastContributionLabel}</h3>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="sticky top-10">
            <InvestmentForm workspaceId={workspace.id} />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-6">
          <InvestmentHistoryWithModal
            investments={investments}
            workspaceId={workspace.id}
            periodLabel={periodLabel}
          />
          <Link
            href="/dashboard/reports"
            className="block bg-gradient-to-r from-primary to-teal-600 rounded-2xl p-6 text-white shadow-lg flex items-center justify-between gap-4"
          >
            <div>
              <h5 className="font-bold text-lg mb-1">{t("evolutionTitle")}</h5>
              <p className="text-white/90 text-sm">
                {t("evolutionDesc")}
              </p>
            </div>
            <span className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all backdrop-blur-sm shrink-0">
              {t("seeCharts")}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
