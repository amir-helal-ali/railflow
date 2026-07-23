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
import { DatabasesView } from "@/components/views/DatabasesView";
import { VolumesView } from "@/components/views/VolumesView";
import { NetworksView } from "@/components/views/NetworksView";
import { ActivityView } from "@/components/views/ActivityView";
import { TeamView } from "@/components/views/TeamView";
import { BackupsView } from "@/components/views/BackupsView";
import { CertificatesView } from "@/components/views/CertificatesView";
import { TerminalView } from "@/components/views/TerminalView";
import { PlaygroundView } from "@/components/views/PlaygroundView";
import { EnvironmentsView } from "@/components/views/EnvironmentsView";
import { StrategiesView } from "@/components/views/StrategiesView";
import { AlertsView } from "@/components/views/AlertsView";
import { HelpView } from "@/components/views/HelpView";
import { PipelinesView } from "@/components/views/PipelinesView";
import { WebhooksView } from "@/components/views/WebhooksView";
import { CostView } from "@/components/views/CostView";
import { ApiHealthView } from "@/components/views/ApiHealthView";
import { AuditSearchView } from "@/components/views/AuditSearchView";
import { MarketplaceView } from "@/components/views/MarketplaceView";
import { RegionsView } from "@/components/views/RegionsView";
import { LogsAggView } from "@/components/views/LogsAggView";
import { useLocalStorage } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Error boundary so a runtime error in one view doesn't kill the whole app. */
class ViewBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ViewBoundary caught:", error, info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-rose-400 mb-2">Error rendering this view</p>
          <pre className="text-xs text-muted-foreground font-mono overflow-auto max-h-32 text-start bg-white/5 p-3 rounded">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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
            <ViewBoundary>
              {view.name === "dashboard" && <DashboardView />}
              {view.name === "projects" && <ProjectsView />}
              {view.name === "project" && <ProjectDetailView projectId={view.projectId} tab={view.tab} />}
              {view.name === "containers" && <ContainersView />}
              {view.name === "server" && <ServerView />}
              {view.name === "deployments" && <DeploymentsView />}
              {view.name === "databases" && <DatabasesView />}
              {view.name === "volumes" && <VolumesView />}
              {view.name === "networks" && <NetworksView />}
              {view.name === "activity" && <ActivityView />}
              {view.name === "team" && <TeamView />}
              {view.name === "backups" && <BackupsView />}
              {view.name === "certificates" && <CertificatesView />}
              {view.name === "terminal" && <TerminalView />}
              {view.name === "playground" && <PlaygroundView />}
              {view.name === "environments" && <EnvironmentsView />}
              {view.name === "strategies" && <StrategiesView />}
              {view.name === "alerts" && <AlertsView />}
              {view.name === "help" && <HelpView />}
              {view.name === "pipelines" && <PipelinesView />}
              {view.name === "webhooks" && <WebhooksView />}
              {view.name === "cost" && <CostView />}
              {view.name === "apiHealth" && <ApiHealthView />}
              {view.name === "auditSearch" && <AuditSearchView />}
              {view.name === "marketplace" && <MarketplaceView />}
              {view.name === "regions" && <RegionsView />}
              {view.name === "logsAgg" && <LogsAggView />}
              {view.name === "settings" && <SettingsView tab={view.tab} />}
            </ViewBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
