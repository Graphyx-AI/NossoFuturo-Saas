import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getWorkspacesForUser,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import { OnboardingSteps } from "@/components/onboarding/onboarding-steps";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const locale = await getLocale();
  if (!user) {
    return redirect({ href: "/login", locale });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at, onboarding_intent")
    .eq("id", user.id)
    .single();

  if (profile?.onboarding_completed_at) {
    return redirect({ href: "/dashboard", locale });
  }

  let workspaces = await getWorkspacesForUser();
  if (workspaces.length === 0) {
    await ensureDefaultWorkspace();
    workspaces = await getWorkspacesForUser();
  }
  const defaultWorkspace = workspaces[0];

  const intent =
    (profile?.onboarding_intent as "personal" | "family" | "business" | "other") ??
    null;

  return (
    <OnboardingSteps
      initialIntent={intent}
      defaultWorkspaceId={defaultWorkspace?.id ?? null}
      defaultWorkspaceName={defaultWorkspace?.name ?? "Minhas Finanças"}
    />
  );
}
