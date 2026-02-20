import { cookies } from "next/headers";
import {
  getResolvedWorkspaceContext,
} from "@/actions/workspaces";
import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "@/app/dashboard/settings/settings-content";

const WORKSPACE_COOKIE = "workspace_id";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const workspaceIdFromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const { workspaces, workspace } = await getResolvedWorkspaceContext(workspaceIdFromCookie);
  const currentWorkspaceId = workspace?.id ?? null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SettingsContent
      userEmail={user?.email}
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
    />
  );
}
