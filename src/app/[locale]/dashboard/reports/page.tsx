import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import {
  getWorkspaceById,
  getWorkspacesForUser,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { CashFlowChart } from "@/components/charts/cash-flow-chart";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";

const MONTH_KEYS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;

const WORKSPACE_COOKIE = "workspace_id";

export default async function ReportsPage() {
  const t = await getTranslations("reports");
  const tDashboard = await getTranslations("dashboard");
  const tMonths = await getTranslations("common.months");
  const locale = await getLocale();
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

  const currentYear = new Date().getFullYear();
  const supabase = await createClient();

  const mIncs = new Array(12).fill(0);
  const mExps = new Array(12).fill(0);
  let tInc = 0,
    tExp = 0,
    tInv = 0,
    tGoa = 0;

  for (let i = 0; i < 12; i++) {
    const start = `${currentYear}-${String(i + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(currentYear, i + 1, 0).getDate();
    const end = `${currentYear}-${String(i + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

    const [transRes, investRes, goalsRes] = await Promise.all([
      supabase
        .from("transactions")
        .select("type, amount")
        .eq("workspace_id", workspace.id)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("investments")
        .select("amount")
        .eq("workspace_id", workspace.id)
        .gte("date", start)
        .lte("date", end),
      supabase
        .from("goal_contributions")
        .select("amount")
        .eq("workspace_id", workspace.id)
        .gte("date", start)
        .lte("date", end),
    ]);

    (transRes.data ?? []).forEach((t) => {
      if (t.type === "income") {
        tInc += t.amount;
        mIncs[i] += t.amount;
      } else {
        tExp += t.amount;
        mExps[i] += t.amount;
      }
    });
    (investRes.data ?? []).forEach((v) => (tInv += v.amount));
    (goalsRes.data ?? []).forEach((g) => (tGoa += g.amount));
  }

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("workspace_id", workspace.id);

  const goalProgress: { id: string; title: string; target: number; accumulated: number }[] = [];
  for (const g of goals ?? []) {
    const { data: contrib } = await supabase
      .from("goal_contributions")
      .select("amount")
      .eq("goal_id", g.id);
    const acc = (contrib ?? []).reduce((a, b) => a + b.amount, 0);
    goalProgress.push({
      id: g.id,
      title: g.title,
      target: g.target_amount,
      accumulated: acc,
    });
  }

  const monthLabels = MONTH_KEYS.map((k) => tMonths(k).substring(0, 3));

  return (
    <div className="space-y-8">
      <RealtimeRefresher
        workspaceId={workspace.id}
        options={{ transactions: true, goals: true, investments: true }}
      />
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">{t("annualReport")}</h2>
      <p className="text-muted-foreground font-medium text-sm sm:text-base">
        {t("year", { year: currentYear })}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-l-8 border-emerald-500">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {t("annualIncome")}
          </p>
          <p className="text-2xl font-extrabold text-emerald-600 mt-1">{formatCurrency(tInc, locale)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-l-8 border-rose-500">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {t("annualExpenses")}
          </p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatCurrency(tExp, locale)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-l-8 border-blue-500">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {t("invested")}
          </p>
          <p className="text-2xl font-extrabold text-blue-600 mt-1">{formatCurrency(tInv, locale)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-l-8 border-primary">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
            {t("goalsSaved")}
          </p>
          <p className="text-2xl font-extrabold text-primary mt-1">{formatCurrency(tGoa, locale)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-card p-4 sm:p-8">
          <h4 className="text-lg sm:text-xl font-bold text-foreground mb-6 sm:mb-8">{t("cashFlowMonthly")}</h4>
          <div className="h-[250px] lg:h-[400px] w-full min-w-0">
            <CashFlowChart
              labels={monthLabels}
              incomeData={mIncs}
              expenseData={mExps}
              locale={locale}
              incomeLabel={tDashboard("income")}
              expenseLabel={tDashboard("expenses")}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-4 sm:p-8">
          <h4 className="text-lg sm:text-xl font-bold text-foreground mb-6 sm:mb-8">{t("goals")}</h4>
          <div className="space-y-6">
            {goalProgress.map((g) => {
              const p = Math.min((g.accumulated / g.target) * 100, 100);
              return (
                <div key={g.id}>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h5 className="text-sm font-bold text-foreground">{g.title}</h5>
                      <p className="text-[10px] text-muted-foreground">
                        {formatCurrency(g.accumulated, locale)} / {formatCurrency(g.target, locale)}
                      </p>
                    </div>
                    <span className="text-xs font-black text-primary">{p.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {goalProgress.length === 0 && (
            <p className="text-muted-foreground italic">{t("noGoals")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
