import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkspaceById,
  getWorkspacesForUser,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import { cookies } from "next/headers";
import { formatCurrency } from "@/lib/utils/currency";
import { WelcomeBanner } from "@/components/onboarding/welcome-banner";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { MONTH_ICONS, getStartOfMonth, getEndOfMonth } from "@/lib/utils/dates";

const WORKSPACE_COOKIE = "workspace_id";

const MONTH_KEYS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tMonths = await getTranslations("common.months");
  const locale = await getLocale();
  const cookieStore = await cookies();
  let workspaces = await getWorkspacesForUser();
  if (workspaces.length === 0) {
    await ensureDefaultWorkspace();
    workspaces = await getWorkspacesForUser();
  }
  const workspaceId = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const firstId = workspaces[0]?.id ?? null;
  const preferredWorkspaceId = workspaceId ?? firstId;
  const workspaceFromPreferred = await getWorkspaceById(preferredWorkspaceId);
  const workspace =
    workspaceFromPreferred ??
    (firstId && firstId !== preferredWorkspaceId ? await getWorkspaceById(firstId) : null);

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

  const grid = await Promise.all(
    MONTH_KEYS.map(async (_, monthIndex) => {
      const start = getStartOfMonth(currentYear, monthIndex);
      const end = getEndOfMonth(currentYear, monthIndex);

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

      let inc = 0,
        exp = 0;
      (transRes.data ?? []).forEach((t) => {
        if (t.type === "income") inc += t.amount;
        else exp += t.amount;
      });
      const inv = (investRes.data ?? []).reduce((a, b) => a + b.amount, 0);
      const goa = (goalsRes.data ?? []).reduce((a, b) => a + b.amount, 0);
      const balance = inc - exp - inv - goa;

      return { monthIndex, name: tMonths(MONTH_KEYS[monthIndex]), icon: MONTH_ICONS[monthIndex], balance };
    })
  );

  return (
    <div data-tour="dashboard-content">
      <RealtimeRefresher
        workspaceId={workspace.id}
        options={{ transactions: true, goals: true, investments: true }}
      />
      <WelcomeBanner />
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">{t("yearView")}</h2>
      <p className="text-muted-foreground font-medium mb-6 sm:mb-8 text-sm sm:text-base">
        {t("smartManagement", { year: currentYear })}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
        {grid.map(({ monthIndex, name, icon, balance }) => (
          <Link
            key={monthIndex}
            href={`/dashboard/transactions?year=${currentYear}&month=${monthIndex}`}
            className="bg-card border border-border rounded-2xl shadow-card p-6 flex flex-col items-center cursor-pointer hover:scale-[1.02] hover:border-primary/50 hover:shadow-card-hover transition-all"
          >
            <span className="text-3xl mb-3">{icon}</span>
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
      </div>
    </div>
  );
}
