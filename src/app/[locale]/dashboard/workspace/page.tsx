import { cookies } from "next/headers";
import {
  ensureDefaultWorkspace,
  getWorkspacesForUser,
} from "@/actions/workspaces";
import {
  getWorkspaceInvites,
  getWorkspaceMembersWithProfiles,
} from "@/actions/invites";
import { createClient } from "@/lib/supabase/server";
import { WorkspaceManagerClient } from "@/components/workspace/workspace-manager-client";

const WORKSPACE_COOKIE = "workspace_id";

export default async function WorkspacePage() {
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

  const [workspaceMembers, workspaceInvites, membershipLookup] = await Promise.all([
    getWorkspaceMembersWithProfiles(currentWorkspaceId),
    getWorkspaceInvites(currentWorkspaceId),
    currentWorkspaceId && user?.id
      ? supabase
          .from("workspace_members")
          .select("role")
          .eq("workspace_id", currentWorkspaceId)
          .eq("user_id", user.id)
          .not("accepted_at", "is", null)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const currentWorkspace = workspaces.find((workspace) => workspace.id === currentWorkspaceId);
  const membershipRole = (membershipLookup.data as { role?: string } | null)?.role;
  const canManageMembers =
    currentWorkspace?.owner_id === user?.id ||
    membershipRole === "owner" ||
    membershipRole === "admin";

  return (
    <WorkspaceManagerClient
      userId={user?.id ?? null}
      workspaces={workspaces}
      currentWorkspaceId={currentWorkspaceId}
      workspaceMembers={workspaceMembers}
      workspaceInvites={workspaceInvites}
      canManageMembers={canManageMembers}
    />
  );
}
