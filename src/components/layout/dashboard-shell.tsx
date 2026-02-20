"use client";

import { useState } from "react";
import type { Workspace } from "@/types/database";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useGuidedTour } from "@/components/onboarding/guided-tour";

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
  useGuidedTour();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 lg:pl-4 bg-background">
        <Header
          workspace={workspace}
          workspaces={workspaces}
          onMenuClick={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:px-6 lg:py-6 relative min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
