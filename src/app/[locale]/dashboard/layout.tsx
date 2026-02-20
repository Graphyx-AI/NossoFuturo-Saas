import { cookies } from "next/headers";
import {
  getWorkspacesForUser,
  getWorkspaceById,
  ensureDefaultWorkspace,
} from "@/actions/workspaces";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { DashboardShell } from "@/components/layout/dashboard-shell";

const WORKSPACE_COOKIE = "workspace_id";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  let workspaces = await getWorkspacesForUser();

  if (workspaces.length === 0) {
    await ensureDefaultWorkspace();
    workspaces = await getWorkspacesForUser();
  }

  const workspaceIdFromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const firstWorkspaceId = workspaces[0]?.id ?? null;
  const preferredWorkspaceId = workspaceIdFromCookie ?? firstWorkspaceId;
  const workspaceFromPreferred = await getWorkspaceById(preferredWorkspaceId);
  const workspace =
    workspaceFromPreferred ??
    (firstWorkspaceId && firstWorkspaceId !== preferredWorkspaceId
      ? await getWorkspaceById(firstWorkspaceId)
      : null);

  return (
    <WorkspaceProvider workspace={workspace}>
      <DashboardShell workspace={workspace} workspaces={workspaces}>
        {children}
      </DashboardShell>
    </WorkspaceProvider>
  );
}
