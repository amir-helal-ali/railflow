"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useRouter } from "@/lib/router";
import { useI18n } from "@/lib/i18n";
import { DashboardView } from "@/components/views/DashboardView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { ProjectDetailView } from "@/components/views/ProjectDetailView";
import { ContainersView } from "@/components/views/ContainersView";
import { ServerView } from "@/components/views/ServerView";
import { DeploymentsView } from "@/components/views/DeploymentsView";
import { SettingsView } from "@/components/views/SettingsView";
import { LoginView } from "@/components/views/LoginView";
import { useLocalStorage } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { dir } = useI18n();
  const { view } = useRouter();
  const [collapsed, setCollapsed] = useLocalStorage("railflow-sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  // Login view is full-screen, no shell
  if (view.name === "login") {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      </div>

      {/* Mobile sidebar (drawer) */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 z-50 lg:hidden animate-in">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* Main */}
      <div
        className={cn(
          "transition-all duration-200",
          collapsed ? "lg:ps-[68px]" : "lg:ps-[248px]",
          dir === "rtl" && (collapsed ? "lg:pe-[68px] lg:ps-0" : "lg:pe-[248px] lg:ps-0")
        )}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto animate-in">
            {view.name === "dashboard" && <DashboardView />}
            {view.name === "projects" && <ProjectsView />}
            {view.name === "project" && <ProjectDetailView projectId={view.projectId} tab={view.tab} />}
            {view.name === "containers" && <ContainersView />}
            {view.name === "server" && <ServerView />}
            {view.name === "deployments" && <DeploymentsView />}
            {view.name === "settings" && <SettingsView tab={view.tab} />}
          </div>
        </main>
      </div>
    </div>
  );
}
