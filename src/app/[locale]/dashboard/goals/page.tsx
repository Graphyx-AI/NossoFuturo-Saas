import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import {
  getWorkspaceById,
  getWorkspacesForUser,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import { getGoals } from "@/actions/goals";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/currency";
import { Target } from "lucide-react";
import { CreateGoalButtonWithModal } from "@/components/goals/create-goal-button-with-modal";
import { GoalContributionForm } from "@/components/forms/goal-contribution-form";
import { GoalsListWithModal } from "@/components/goals/goals-list-with-modal";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";

const WORKSPACE_COOKIE = "workspace_id";

export default async function GoalsPage() {
  const t = await getTranslations("goals");
  const tDashboard = await getTranslations("dashboard");
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

  const goals = await getGoals(workspace.id);
  const supabase = await createClient();
  const contributionsByGoal: Record<string, number> = {};
  for (const g of goals) {
    const { data } = await supabase
      .from("goal_contributions")
      .select("amount")
      .eq("goal_id", g.id);
    contributionsByGoal[g.id] = (data ?? []).reduce((a, b) => a + b.amount, 0);
  }

  const totalTarget = goals.reduce((acc, g) => acc + g.target_amount, 0);
  const totalCurrent = goals.reduce((acc, g) => acc + (contributionsByGoal[g.id] ?? 0), 0);
  const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <div className="space-y-8">
      <RealtimeRefresher
        workspaceId={workspace.id}
        options={{ goals: true }}
      />
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t("pageSubtitle")}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <p className="text-muted-foreground text-sm font-medium mb-1">{t("totalAccumulated")}</p>
          <h3 className="text-2xl font-bold text-primary">
            {formatCurrency(totalCurrent, locale)}
          </h3>
          <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min(overallProgress, 100)}%` }}
            />
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-card p-6">
          <p className="text-muted-foreground text-sm font-medium mb-1">{t("totalTarget")}</p>
          <h3 className="text-2xl font-bold text-foreground">
            {formatCurrency(totalTarget, locale)}
          </h3>
          <p className="text-xs text-muted-foreground mt-2">{t("targetSum")}</p>
        </div>
        <div className="bg-primary rounded-2xl shadow-card p-6 text-primary-foreground">
          <p className="text-primary-foreground/80 text-sm font-medium mb-1">{t("averageProgress")}</p>
          <h3 className="text-2xl font-bold">
            {overallProgress.toFixed(1)}% {t("achieved")}
          </h3>
          <p className="text-xs text-primary-foreground/80 mt-2">{t("keepFocused")}</p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-4 space-y-6">
          <CreateGoalButtonWithModal workspaceId={workspace.id} />
          <GoalContributionForm workspaceId={workspace.id} goals={goals} />
        </section>
        <section className="lg:col-span-8">
          <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">{t("myGoals")}</h2>
              <span className="text-xs font-bold text-muted-foreground">
                {goals.length} {goals.length === 1 ? t("active") : t("actives")}
              </span>
            </div>
            <div className="divide-y divide-border">
              {goals.length === 0 ? (
                <div className="p-16 text-center">
                  <Target size={40} className="mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground font-medium">{t("noGoals")}</p>
                </div>
              ) : (
                <GoalsListWithModal
                  goals={goals}
                  contributionsByGoal={contributionsByGoal}
                  workspaceId={workspace.id}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
