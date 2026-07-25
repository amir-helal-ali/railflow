"use client";

import * as React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { StatusBar } from "./StatusBar";
import { Onboarding } from "./Onboarding";
import { ErrorBoundary } from "./ErrorBoundary";
import { ShortcutsHelp } from "./ShortcutsHelp";
import { useRouter } from "@/lib/router";
import { useI18n } from "@/lib/i18n";
import { useKeyboardShortcuts, onShortcut } from "@/hooks/use-keyboard-shortcuts";
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
import { SecurityView } from "@/components/views/SecurityView";
import { PerformanceView } from "@/components/views/PerformanceView";
import { MetricsExplorerView } from "@/components/views/MetricsExplorerView";
import { IntegrationsView } from "@/components/views/IntegrationsView";
import { useLocalStorage } from "@/lib/format";
import { cn } from "@/lib/utils";

export function AppShell() {
  const { dir } = useI18n();
  const { view, navigate } = useRouter();
  const [collapsed, setCollapsed] = useLocalStorage("railflow-sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [shortcutsOpen, setShortcutsOpen] = React.useState(false);

  // Activate the global keyboard shortcuts listener
  useKeyboardShortcuts(true);

  // Toggle sidebar via Cmd/Ctrl + B
  React.useEffect(() => {
    return onShortcut("railflow:toggle-sidebar", () => setCollapsed((c) => !c));
  }, [setCollapsed]);

  // Show shortcuts help via Cmd/Ctrl + /
  React.useEffect(() => {
    return onShortcut("railflow:show-shortcuts", () => setShortcutsOpen(true));
  }, []);

  // Close modals on Esc (handled here as a safety net in case a child didn't)
  React.useEffect(() => {
    return onShortcut("railflow:close-modals", () => {
      setShortcutsOpen(false);
      setMobileOpen(false);
    });
  }, []);

  // G-prefix + single-key navigation
  React.useEffect(() => {
    const unsub1 = onShortcut("railflow:go-dashboard", () => navigate({ name: "dashboard" }));
    const unsub2 = onShortcut("railflow:go-projects", () => navigate({ name: "projects" }));
    const unsub3 = onShortcut("railflow:go-containers", () => navigate({ name: "containers" }));
    const unsub4 = onShortcut("railflow:go-deployments", () => navigate({ name: "deployments" }));
    const unsub5 = onShortcut("railflow:go-server", () => navigate({ name: "server" }));
    const unsub6 = onShortcut("railflow:go-settings", () => navigate({ name: "settings" }));
    const unsub7 = onShortcut("railflow:open-terminal", () => navigate({ name: "terminal" }));
    return () => {
      unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); unsub7();
    };
  }, [navigate]);

  // Login view is full-screen, no shell
  if (view.name === "login") {
    return (
      <>
        <ErrorBoundary label="Login View">
          <LoginView />
        </ErrorBoundary>
        <Onboarding />
        <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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
          "flex-1 flex flex-col transition-all duration-200",
          collapsed ? "lg:ps-[68px]" : "lg:ps-[248px]",
          dir === "rtl" && (collapsed ? "lg:pe-[68px] lg:ps-0" : "lg:pe-[248px] lg:ps-0"),
        )}
      >
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <div className="max-w-[1600px] mx-auto animate-in">
            <ErrorBoundary label={view.name}>
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
              {view.name === "security" && <SecurityView />}
              {view.name === "performance" && <PerformanceView />}
              {view.name === "metricsExplorer" && <MetricsExplorerView />}
              {view.name === "integrations" && <IntegrationsView />}
              {view.name === "settings" && <SettingsView tab={view.tab} />}
            </ErrorBoundary>
          </div>
        </main>
        <StatusBar />
      </div>

      {/* Overlays */}
      <Onboarding />
      <ShortcutsHelp open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </div>
  );
}
