import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { cookies } from "next/headers";
import { getResolvedWorkspaceContext } from "@/actions/workspaces";
import { getMonthlyTransactions } from "@/actions/transactions";
import { getCategoriesForWorkspace } from "@/actions/categories";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { getStartOfMonth, getEndOfMonth, getTodayISO } from "@/lib/utils/dates";

const MONTH_KEYS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"] as const;
import { TransactionForm } from "@/components/forms/transaction-form";
import { ImportButtonWithModal } from "@/components/import/import-button-with-modal";
import { TransactionHistoryWithModal } from "@/components/transactions/transaction-history-with-modal";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";

const WORKSPACE_COOKIE = "workspace_id";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const t = await getTranslations("dashboard");
  const tTransactions = await getTranslations("transactions");
  const tMonths = await getTranslations("common.months");
  const locale = await getLocale();
  const params = await searchParams;
  const year = params.year ? parseInt(params.year, 10) : new Date().getFullYear();
  const month = params.month ? parseInt(params.month, 10) : new Date().getMonth();
  const cookieStore = await cookies();
  const workspaceIdFromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const { workspace } = await getResolvedWorkspaceContext(workspaceIdFromCookie);

  if (!workspace) {
    return (
      <div className="py-10 text-muted-foreground">{t("selectWorkspace")}</div>
    );
  }

  const [transactions, categories] = await Promise.all([
    getMonthlyTransactions(workspace.id, year, month),
    getCategoriesForWorkspace(workspace.id),
  ]);

  const start = getStartOfMonth(year, month);
  const end = getEndOfMonth(year, month);
  const supabase = await createClient();
  const [investRes, goalsRes] = await Promise.all([
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
  transactions.forEach((t) => {
    if (t.type === "income") inc += t.amount;
    else exp += t.amount;
  });
  const inv = (investRes.data ?? []).reduce((a, b) => a + b.amount, 0);
  const goa = (goalsRes.data ?? []).reduce((a, b) => a + b.amount, 0);
  const balance = inc - exp - inv - goa;

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-8">
      <RealtimeRefresher
        workspaceId={workspace.id}
        options={{ transactions: true, goals: true, investments: true }}
      />
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            {tMonths(MONTH_KEYS[month])} {year}
          </h2>
          <p className="text-muted-foreground font-medium text-sm sm:text-base">{t("monthTransactions")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ImportButtonWithModal
            workspaceId={workspace.id}
            expenseCategories={expenseCategories}
            incomeCategories={incomeCategories}
          />
          <Link
            href="/dashboard"
            className="text-sm font-bold text-primary hover:underline self-start"
          >
            {t("backToYear")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-b-4 border-emerald-400">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase">{t("income")}</p>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(inc, locale)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-b-4 border-rose-400">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase">{t("expenses")}</p>
          <p className="text-2xl font-black text-rose-600">{formatCurrency(exp, locale)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-b-4 border-blue-400">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase">{t("invested")}</p>
          <p className="text-2xl font-black text-blue-600">{formatCurrency(inv, locale)}</p>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6 border-b-4 border-primary">
          <p className="text-[10px] font-extrabold text-muted-foreground uppercase">{t("goals")}</p>
          <p className="text-2xl font-black text-primary">{formatCurrency(goa, locale)}</p>
        </div>
      </div>
      <p className="text-sm font-bold">
        {t("freeBalance")}:{" "}
        <span className={balance >= 0 ? "text-emerald-600" : "text-rose-600"}>
          {formatCurrency(balance, locale)}
        </span>
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
        <div className="lg:col-span-4">
          <TransactionForm
            workspaceId={workspace.id}
            year={year}
            month={month}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            defaultDate={getTodayISO()}
          />
        </div>
        <div className="lg:col-span-8">
          <TransactionHistoryWithModal
            transactions={transactions}
            incomeCategories={incomeCategories}
            expenseCategories={expenseCategories}
            workspaceId={workspace.id}
            year={year}
            month={month}
            defaultDate={getTodayISO()}
          />
        </div>
      </div>
    </div>
  );
}
