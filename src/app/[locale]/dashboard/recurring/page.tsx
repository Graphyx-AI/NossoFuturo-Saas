import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { getResolvedWorkspaceContext } from "@/actions/workspaces";
import { getRecurringTransactions } from "@/actions/recurring";
import { getCategoriesForWorkspace } from "@/actions/categories";
import { Repeat } from "lucide-react";
import { RecurringForm } from "@/components/forms/recurring-form";
import { RecurringList } from "@/components/recurring/recurring-list";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";

const WORKSPACE_COOKIE = "workspace_id";

const FREQ_LABELS: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
  yearly: "Anual",
};

export default async function RecurringPage() {
  const t = await getTranslations("recurring");
  const locale = await getLocale();
  const tDashboard = await getTranslations("dashboard");
  const cookieStore = await cookies();
  const workspaceIdFromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const { workspace } = await getResolvedWorkspaceContext(workspaceIdFromCookie);

  if (!workspace) {
    return (
      <div className="py-10 text-muted-foreground">{tDashboard("selectWorkspace")}</div>
    );
  }

  const [recurrings, categories] = await Promise.all([
    getRecurringTransactions(workspace.id),
    getCategoriesForWorkspace(workspace.id),
  ]);
  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-8">
      <RealtimeRefresher workspaceId={workspace.id} options={{ transactions: true }} />
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t("pageSubtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-card border border-border rounded-2xl shadow-card p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">{t("addRecurring")}</h2>
            <RecurringForm
              workspaceId={workspace.id}
              incomeCategories={incomeCategories}
              expenseCategories={expenseCategories}
            />
          </div>
        </section>
        <section className="lg:col-span-8">
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">{t("myRecurring")}</h2>
              <span className="text-xs font-bold text-muted-foreground">
                {recurrings.length} {recurrings.length === 1 ? t("active") : t("actives")}
              </span>
            </div>
            <div className="divide-y divide-border">
              {recurrings.length === 0 ? (
                <div className="p-16 text-center">
                  <Repeat size={40} className="mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground font-medium">{t("noRecurring")}</p>
                </div>
              ) : (
                <RecurringList
                  recurrings={recurrings}
                  workspaceId={workspace.id}
                  locale={locale}
                  freqLabels={FREQ_LABELS}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
