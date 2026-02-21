"use client";

import { useState } from "react";
import type { Workspace } from "@/types/database";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useGuidedTour } from "@/components/onboarding/guided-tour";
import { CommandPalette } from "@/components/command-palette";

export function DashboardShell({
  workspace,
  workspaces,
  children,
}: {
  workspace: Workspace | null;
  workspaces: Workspace[];
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useGuidedTour();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <CommandPalette />
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        <Header
          workspace={workspace}
          workspaces={workspaces}
          onMenuClick={() => setMobileMenuOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
          onSidebarToggle={() => setSidebarCollapsed((v) => !v)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:px-6 lg:py-6 relative min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
