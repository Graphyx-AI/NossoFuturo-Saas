import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getResolvedWorkspaceContext,
} from "@/actions/workspaces";
import { getBudgetsWithUsage } from "@/actions/budgets";
import { checkAndCreateNotifications } from "@/actions/notifications-check";
import { cookies } from "next/headers";
import { formatCurrency } from "@/lib/utils/currency";
import { WelcomeBanner } from "@/components/onboarding/welcome-banner";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { MonthIcon } from "@/components/month-icon";
import { BudgetAlertsCard } from "@/components/budgets/budget-alerts-card";

const WORKSPACE_COOKIE = "workspace_id";

const MONTH_KEYS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tMonths = await getTranslations("common.months");
  const locale = await getLocale();
  const cookieStore = await cookies();
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const { workspace } = await getResolvedWorkspaceContext(workspaceId);

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground mb-4">{t("noWorkspace")}</p>
        <Link href="/dashboard/settings" className="bg-hero-gradient text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
          {t("settings")}
        </Link>
      </div>
    );
  }

  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  const { data: summary, error: summaryError } = await supabase.rpc("get_dashboard_year_summary", {
    p_workspace_id: workspace.id,
    p_year: currentYear,
  });

  const summaryByMonth = new Map<number, { income: number; expense: number; investment: number; goal: number }>();

  if (!summaryError && Array.isArray(summary) && summary.length > 0) {
    summary.forEach((row: any) => {
      const monthIndex = Number(row.month_index) - 1;
      summaryByMonth.set(monthIndex, {
        income: Number(row.income_cents ?? 0),
        expense: Number(row.expense_cents ?? 0),
        investment: Number(row.investment_cents ?? 0),
        goal: Number(row.goal_cents ?? 0),
      });
    });
  } else {
    // Fallback para ambientes onde a RPC ainda nao foi aplicada.
    const yearStart = `${currentYear}-01-01`;
    const yearEnd = `${currentYear}-12-31`;

    const [transactionsRes, investmentsRes, goalsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("type, amount, date")
        .eq("workspace_id", workspace.id)
        .gte("date", yearStart)
        .lte("date", yearEnd),
      supabase
        .from("investments")
        .select("amount, date")
        .eq("workspace_id", workspace.id)
        .gte("date", yearStart)
        .lte("date", yearEnd),
      supabase
        .from("goal_contributions")
        .select("amount, date")
        .eq("workspace_id", workspace.id)
        .gte("date", yearStart)
        .lte("date", yearEnd),
    ]);

    (transactionsRes.data ?? []).forEach((tr: { type: string; amount: number; date: string }) => {
      const monthIndex = new Date(tr.date).getMonth();
      const current = summaryByMonth.get(monthIndex) ?? { income: 0, expense: 0, investment: 0, goal: 0 };
      if (tr.type === "income") current.income += tr.amount;
      if (tr.type === "expense") current.expense += tr.amount;
      summaryByMonth.set(monthIndex, current);
    });

    (investmentsRes.data ?? []).forEach((inv: { amount: number; date: string }) => {
      const monthIndex = new Date(inv.date).getMonth();
      const current = summaryByMonth.get(monthIndex) ?? { income: 0, expense: 0, investment: 0, goal: 0 };
      current.investment += inv.amount;
      summaryByMonth.set(monthIndex, current);
    });

    (goalsRes.data ?? []).forEach((goal: { amount: number; date: string }) => {
      const monthIndex = new Date(goal.date).getMonth();
      const current = summaryByMonth.get(monthIndex) ?? { income: 0, expense: 0, investment: 0, goal: 0 };
      current.goal += goal.amount;
      summaryByMonth.set(monthIndex, current);
    });
  }

  const currentMonth = new Date().getMonth() + 1;
  const [budgetsWithUsage, _] = await Promise.all([
    getBudgetsWithUsage(workspace.id, currentYear, currentMonth),
    checkAndCreateNotifications(workspace.id),
  ]);
  const budgetAlerts = budgetsWithUsage.filter((b) => {
    const pct = b.limit_amount > 0 ? (b.used_amount / b.limit_amount) * 100 : 0;
    return pct >= 80;
  });

  const grid = MONTH_KEYS.map((_, monthIndex) => {
    const s = summaryByMonth.get(monthIndex) ?? { income: 0, expense: 0, investment: 0, goal: 0 };
    const balance = s.income - s.expense - s.investment - s.goal;
    return { monthIndex, name: tMonths(MONTH_KEYS[monthIndex]), balance };
  });

  return (
    <div data-tour="dashboard-content">
      <RealtimeRefresher
        workspaceId={workspace.id}
        options={{ transactions: true, goals: true, investments: true }}
      />
      <WelcomeBanner />
      {budgetAlerts.length > 0 && (
        <BudgetAlertsCard alerts={budgetAlerts} locale={locale} />
      )}
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t("yearView")}</h2>
      <p className="text-muted-foreground font-medium mb-6 sm:mb-8 text-sm sm:text-base">
        {t("smartManagement", { year: currentYear })}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
        {grid.map(({ monthIndex, name, balance }) => (
          <Link
            key={monthIndex}
            href={`/dashboard/transactions?year=${currentYear}&month=${monthIndex}`}
            className="bg-card border border-border rounded-2xl shadow-card p-6 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:border-primary/50 hover:shadow-card-hover transition-all"
          >
            <MonthIcon monthIndex={monthIndex} className="w-10 h-10 mb-3 text-primary" />
            <h3 className="font-bold text-foreground text-sm">{name}</h3>
            <p
              className={`text-[10px] mt-2 font-bold ${balance >= 0 ? "text-emerald-500" : "text-rose-500"
                }`}
            >
              {formatCurrency(balance, locale)}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-8 sm:mt-10 flex flex-wrap gap-3 sm:gap-4">
        <Link
          href="/dashboard/reports"
          className="text-sm font-bold text-primary hover:underline"
        >
          {t("seeReports")}
        </Link>
        <Link
          href="/dashboard/transactions"
          className="text-sm font-bold text-muted-foreground hover:underline"
        >
          {t("transactions")}
        </Link>
        <Link
          href="/dashboard/budgets"
          className="text-sm font-bold text-muted-foreground hover:underline"
        >
          {t("budgets")}
        </Link>
      </div>
    </div>
  );
}
