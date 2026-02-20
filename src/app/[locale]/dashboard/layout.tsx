import { cookies } from "next/headers";
import {
  getResolvedWorkspaceContext,
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
  const workspaceIdFromCookie = cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
  const { workspaces, workspace } = await getResolvedWorkspaceContext(workspaceIdFromCookie);

  return (
    <WorkspaceProvider workspace={workspace}>
      <DashboardShell workspace={workspace} workspaces={workspaces}>
        {children}
      </DashboardShell>
    </WorkspaceProvider>
  );
}
