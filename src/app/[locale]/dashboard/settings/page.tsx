import { cookies } from "next/headers";
import {
  getWorkspacesForUser,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import {
  getWorkspaceMembersWithProfiles,
  getWorkspaceInvites,
} from "@/actions/invites";
import { createClient } from "@/lib/supabase/server";
import { SettingsContent } from "@/app/dashboard/settings/settings-content";

const WORKSPACE_COOKIE = "workspace_id";

export default async function SettingsPage() {
  const cookieStore = await cookies();
  let workspaces = await getWorkspacesForUser();
  if (workspaces.length === 0) {
    await ensureDefaultWorkspace();
    workspaces = await getWorkspacesForUser();
  }
  const currentWorkspaceId =
    cookieStore.get(WORKSPACE_COOKIE)?.value ?? workspaces[0]?.id ?? null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [workspaceMembers, workspaceInvites] = await Promise.all([
    getWorkspaceMembersWithProfiles(currentWorkspaceId),
    getWorkspaceInvites(currentWorkspaceId),
  ]);

  const currentMember = workspaceMembers.find((m) => m.user_id === user?.id);
  const canManageMembers =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  return (
    <SettingsContent
      userEmail={user?.email}
      userId={user?.id ?? null}
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
      workspaceMembers={workspaceMembers}
      workspaceInvites={workspaceInvites}
      canManageMembers={canManageMembers}
    />
  );
}
