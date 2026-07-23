"use client";

import * as React from "react";
import {
  LayoutDashboard,
  FolderGit2,
  Boxes,
  Rocket,
  Server,
  Database,
  HardDrive,
  Network,
  Settings,
  Users,
  Activity,
  BookOpen,
  ShieldCheck,
  Archive,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useRouter, type View } from "@/lib/router";
import { mockProjects, mockDatabases, mockContainers } from "@/lib/mock-data";

type NavItem = {
  icon: React.ElementType;
  labelKey: string;
  view: View;
  badge?: number;
};

type NavGroup = {
  titleKey: string;
  items: NavItem[];
};

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle?: () => void }) {
  const { t, dir } = useI18n();
  const { view, navigate } = useRouter();

  const groups: NavGroup[] = [
    {
      titleKey: "nav.group.overview",
      items: [
        { icon: LayoutDashboard, labelKey: "nav.dashboard", view: { name: "dashboard" } },
        { icon: FolderGit2, labelKey: "nav.projects", view: { name: "projects" }, badge: mockProjects.length },
        { icon: Rocket, labelKey: "nav.deployments", view: { name: "deployments" } },
        { icon: Activity, labelKey: "nav.activity", view: { name: "activity" } },
      ],
    },
    {
      titleKey: "nav.group.resources",
      items: [
        { icon: Boxes, labelKey: "nav.containers", view: { name: "containers" }, badge: mockContainers.filter(c => c.status === "running").length },
        { icon: Server, labelKey: "nav.server", view: { name: "server" } },
        { icon: Database, labelKey: "nav.databases", view: { name: "databases" }, badge: mockDatabases.length },
        { icon: HardDrive, labelKey: "nav.volumes", view: { name: "volumes" } },
        { icon: Network, labelKey: "nav.networks", view: { name: "networks" } },
        { icon: Archive, labelKey: "backups.title", view: { name: "backups" } },
        { icon: ShieldCheck, labelKey: "certificates.title", view: { name: "certificates" } },
      ],
    },
    {
      titleKey: "nav.group.account",
      items: [
        { icon: Users, labelKey: "nav.team", view: { name: "team" } },
        { icon: Settings, labelKey: "nav.settings", view: { name: "settings" } },
        { icon: BookOpen, labelKey: "nav.docs", view: { name: "dashboard" } },
      ],
    },
  ];

  const isActive = (item: NavItem) => item.view.name === view.name;

  return (
    <aside
      className={cn(
        "fixed inset-y-0 z-30 flex flex-col glass-card border-0 border-r border-white/5 transition-all duration-200",
        collapsed ? "w-[68px]" : "w-[248px]",
        dir === "rtl" ? "right-0 border-r-0 border-l" : "left-0"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 px-4 border-b border-white/5", collapsed && "justify-center")}>
        <div className="flex items-center gap-2.5">
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center neon-glow shrink-0">
            <Zap className="w-5 h-5 text-white" fill="white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[15px] gradient-text">{t("app.name")}</span>
              <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider">{t("app.tagline")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar py-4 px-2.5 space-y-6">
        {groups.map((group) => (
          <div key={group.titleKey}>
            {!collapsed && (
              <h3 className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50">
                {t(group.titleKey)}
              </h3>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item);
                return (
                  <button
                    key={item.labelKey}
                    onClick={() => navigate(item.view)}
                    title={t(item.labelKey)}
                    className={cn(
                      "group relative flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-sm font-medium transition-all",
                      collapsed && "justify-center",
                      active
                        ? "bg-gradient-to-r from-violet-500/20 to-transparent text-foreground"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    {active && (
                      <span
                        className={cn(
                          "absolute top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-cyan-400",
                          dir === "rtl" ? "right-0" : "left-0"
                        )}
                      />
                    )}
                    <Icon className={cn("w-4 h-4 shrink-0", active && "text-violet-300")} />
                    {!collapsed && <span className="flex-1 text-start">{t(item.labelKey)}</span>}
                    {!collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-white/10 text-muted-foreground tabular-nums">
                        {item.badge}
                      </span>
                    )}
                    {collapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-violet-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/5 p-2.5">
        <button
          onClick={onToggle}
          className={cn(
            "flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? (
            dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              {dir === "rtl" ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
