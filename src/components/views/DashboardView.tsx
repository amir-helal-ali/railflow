"use client";

import * as React from "react";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  ArrowUpRight,
  Server as ServerIcon,
  Rocket,
  Boxes,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  TerminalSquare,
  Code2,
  Zap,
  Wifi,
  TrendingUp,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import {
  mockProjects,
  mockContainers,
  mockDeployments,
  mockServerInfo,
  mockDockerEvents,
  mockActivity,
  generateMultiSeries,
} from "@/lib/mock-data";
import { MetricCard, StatusBadge, SectionHeader, ProgressBar } from "@/components/dashboard/shared";
import { AreaTimeChart, BarCountChart, RadialGauge } from "@/components/charts";
import { formatUptime, timeAgo, useInterval } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useNotify } from "@/components/dashboard/Toaster";

export function DashboardView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const notify = useNotify();

  // Generate series only on client to avoid hydration mismatch from Math.random
  const [series, setSeries] = React.useState<ReturnType<typeof generateMultiSeries> | null>(null);
  React.useEffect(() => {
    setSeries(generateMultiSeries());
  }, []);
  useInterval(() => setSeries(generateMultiSeries()), 10_000);

  // Live CPU/RAM/Disk/Network values for the System Health widget
  const [live, setLive] = React.useState({
    cpu: mockServerInfo.cpu.overallUsage,
    mem: (mockServerInfo.memory.usedGb / mockServerInfo.memory.totalGb) * 100,
    disk: (mockServerInfo.disk.usedGb / mockServerInfo.disk.totalGb) * 100,
    net: mockServerInfo.network.interfaces[0].inboundMbps + mockServerInfo.network.interfaces[0].outboundMbps,
  });
  useInterval(() => {
    setLive({
      cpu: Math.max(5, Math.min(95, mockServerInfo.cpu.overallUsage + (Math.random() - 0.5) * 12)),
      mem: Math.max(20, Math.min(85, (mockServerInfo.memory.usedGb / mockServerInfo.memory.totalGb) * 100 + (Math.random() - 0.5) * 6)),
      disk: Math.max(30, Math.min(70, (mockServerInfo.disk.usedGb / mockServerInfo.disk.totalGb) * 100 + (Math.random() - 0.5) * 2)),
      net: Math.max(50, 800 + Math.random() * 600),
    });
  }, 3000);

  // Until client-side series are generated, use empty placeholders
  const cpuSeries = series?.cpu;
  const memSeries = series?.memory;
  const _netSeries = series?.network;
  const deploySeries = series?.deployments;
  const sparkCpu = cpuSeries?.points.map((p) => p.value) ?? [];
  const sparkMem = memSeries?.points.map((p) => p.value) ?? [];
  const sparkDeploy = deploySeries?.points.map((p) => p.value) ?? [];

  const activeProjects = mockProjects.filter((p) => p.status === "done").length;
  const runningContainers = mockContainers.filter((c) => c.status === "running").length;
  const activeDeployments = mockDeployments.filter((d) => d.status === "building" || d.status === "queued").length;
  const _failedDeploys = mockDeployments.filter((d) => d.status === "failed").length;

  const hourlyDeploys = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = (new Date().getHours() - 23 + i + 24) % 24;
      return { label: `${hour.toString().padStart(2, "0")}`, value: 0 };
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("dashboard.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs">
            <span className="relative inline-flex">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-400" />
            </span>
            <span className="text-muted-foreground">{t("common.live")}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <span className="text-muted-foreground tabular-nums">
              {formatUptime(mockServerInfo.uptime, locale)}
            </span>
          </div>
        </div>
      </div>

      {/* NEW: Quick Actions + System Health (top row) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <QuickActionsWidget
          t={t}
          onDeploy={() => { navigate({ name: "deployments" }); notify.deployStarted(); }}
          onNewProject={() => { navigate({ name: "projects" }); notify.projectCreated(); }}
          onTerminal={() => navigate({ name: "terminal" })}
          onPlayground={() => navigate({ name: "playground" })}
          activeDeployments={activeDeployments}
        />
        <SystemHealthWidget
          t={t}
          cpu={live.cpu}
          mem={live.mem}
          disk={live.disk}
          net={live.net}
          locale={locale}
        />
      </div>

      {/* Top metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label={t("dashboard.activeProjects")}
          value={activeProjects}
          unit={`/ ${mockProjects.length}`}
          delta={{ value: 12.5, positive: true }}
          spark={sparkDeploy}
          color="oklch(0.72 0.22 295)"
          icon={<GitBranch className="w-4 h-4" />}
        />
        <MetricCard
          label={t("dashboard.runningContainers")}
          value={runningContainers}
          unit={`/ ${mockContainers.length}`}
          delta={{ value: 0, positive: true }}
          spark={sparkCpu}
          color="oklch(0.78 0.17 190)"
          icon={<Boxes className="w-4 h-4" />}
        />
        <MetricCard
          label={t("dashboard.cpuUsage")}
          value={live.cpu.toFixed(1)}
          unit="%"
          delta={{ value: 3.2, positive: false }}
          spark={sparkCpu}
          color="oklch(0.75 0.2 145)"
          icon={<Cpu className="w-4 h-4" />}
        />
        <MetricCard
          label={t("dashboard.memoryUsage")}
          value={live.mem.toFixed(0)}
          unit="%"
          delta={{ value: 1.8, positive: false }}
          spark={sparkMem}
          color="oklch(0.78 0.18 75)"
          icon={<MemoryStick className="w-4 h-4" />}
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Resource usage chart - spans 2 cols */}
        <div className="lg:col-span-2 glass-card glass-card-hover p-5">
          <SectionHeader
            title={t("dashboard.resourceUsage")}
            subtitle={t("server.history")}
            action={
              <div className="flex items-center gap-3 text-xs">
                {[
                  { c: "oklch(0.72 0.22 295)", l: "CPU" },
                  { c: "oklch(0.78 0.17 190)", l: "MEM" },
                  { c: "oklch(0.75 0.2 145)", l: "NET" },
                ].map((x) => (
                  <span key={x.l} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: x.c }} />
                    <span className="text-muted-foreground">{x.l}</span>
                  </span>
                ))}
              </div>
            }
          />
          {series && <AreaTimeChart series={[series.cpu, series.memory, series.network]} height={240} />}
          {!series && <div className="h-[240px] shimmer rounded-lg" />}
        </div>

        {/* Health score */}
        <div className="glass-card glass-card-hover p-5">
          <SectionHeader title={t("dashboard.healthScore")} />
          <div className="flex flex-col items-center gap-4 py-4">
            <RadialGauge
              value={97}
              label={t("status.healthy")}
              sublabel={t("dashboard.uptime30d")}
              size={160}
            />
            <div className="grid grid-cols-2 gap-3 w-full">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <div className="text-xl font-semibold tabular-nums">99.97%</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase">{t("dashboard.uptime30d")}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <div className="text-xl font-semibold tabular-nums text-emerald-400">0</div>
                <div className="text-[10px] text-muted-foreground mt-1 uppercase">{t("dashboard.lastIncident")}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{t("dashboard.noIncidents")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent deployments */}
        <div className="lg:col-span-2 glass-card glass-card-hover p-5">
          <SectionHeader
            title={t("dashboard.recentDeployments")}
            action={
              <button
                onClick={() => navigate({ name: "deployments" })}
                className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
              >
                {t("common.viewAll")}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="space-y-1">
            {mockDeployments.slice(0, 6).map((d) => (
              <button
                key={d.id}
                onClick={() => navigate({ name: "project", projectId: d.projectId, tab: "deployments" })}
                className="flex items-center gap-3 w-full px-2 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-start"
              >
                <img src={d.authorAvatar} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{d.projectName}</span>
                    <code className="text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">{d.commitSha}</code>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{d.commitMessage}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={d.status} />
                  <span className="text-[10px] text-muted-foreground/70" suppressHydrationWarning>{timeAgo(d.startedAt, locale)}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top containers */}
        <div className="glass-card glass-card-hover p-5">
          <SectionHeader
            title={t("dashboard.topContainers")}
            action={
              <button
                onClick={() => navigate({ name: "containers" })}
                className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
              >
                {t("common.viewAll")}
                <ArrowUpRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="space-y-3">
            {[...mockContainers]
              .filter((c) => c.status === "running")
              .sort((a, b) => b.stats.cpuPercent - a.stats.cpuPercent)
              .slice(0, 5)
              .map((c) => (
                <div key={c.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate({ name: "containers" })}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate group-hover:text-violet-300 transition-colors">{c.name}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{c.stats.cpuPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          c.stats.cpuPercent > 60 ? "bg-rose-500" : c.stats.cpuPercent > 30 ? "bg-amber-400" : "bg-emerald-400"
                        )}
                        style={{ width: `${c.stats.cpuPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Third row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Deployment activity */}
        <div className="glass-card glass-card-hover p-5">
          <SectionHeader title={t("dashboard.deploymentActivity")} subtitle={t("server.history")} />
          <BarCountChart data={hourlyDeploys} height={160} />
        </div>

        {/* System events */}
        <div className="lg:col-span-2 glass-card glass-card-hover p-5">
          <SectionHeader
            title={t("dashboard.systemEvents")}
            action={
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="relative inline-flex">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-400" />
                </span>
                <span>{t("common.live")}</span>
              </div>
            }
          />
          <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin">
            {mockDockerEvents.slice(0, 8).map((e) => {
              const isError = e.action.includes("unhealthy") || e.action.includes("die") || e.action.includes("stop");
              const isStart = e.action === "start" || e.action.includes("healthy");
              return (
                <div key={e.id} className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-white/5">
                  {isError ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 mt-0.5 shrink-0" />
                  ) : isStart ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <Activity className="w-3.5 h-3.5 text-violet-300 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs">{e.message}</p>
                    <p className="text-[10px] text-muted-foreground/70" suppressHydrationWarning>{timeAgo(e.time, locale)} · {e.type}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* NEW: Recent Activity timeline */}
      <RecentActivityWidget t={t} locale={locale} onViewAll={() => navigate({ name: "activity" })} />
    </div>
  );
}

/* ============================================================ *
 *  Quick Actions widget — deploy / new project / terminal /    *
 *  API playground shortcuts + active deployments counter.      *
 * ============================================================ */
function QuickActionsWidget({
  t,
  onDeploy,
  onNewProject,
  onTerminal,
  onPlayground,
  activeDeployments,
}: {
  t: (k: string) => string;
  onDeploy: () => void;
  onNewProject: () => void;
  onTerminal: () => void;
  onPlayground: () => void;
  activeDeployments: number;
}) {
  const actions = [
    { label: t("dashboard.action.deploy"), icon: Rocket, onClick: onDeploy, gradient: "from-violet-500/20 to-cyan-400/10", iconColor: "text-violet-300" },
    { label: t("dashboard.action.newProject"), icon: Plus, onClick: onNewProject, gradient: "from-emerald-500/20 to-cyan-400/10", iconColor: "text-emerald-300" },
    { label: t("dashboard.action.terminal"), icon: TerminalSquare, onClick: onTerminal, gradient: "from-cyan-500/20 to-violet-400/10", iconColor: "text-cyan-300" },
    { label: t("dashboard.action.playground"), icon: Code2, onClick: onPlayground, gradient: "from-amber-500/20 to-violet-400/10", iconColor: "text-amber-300" },
  ];

  return (
    <div className="glass-card glass-card-hover p-5">
      <SectionHeader
        title={t("dashboard.quickActions")}
        action={
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="relative inline-flex">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-violet-400" />
            </span>
            <span>{activeDeployments} {t("statusBar.activeDeployments").toLowerCase()}</span>
          </div>
        }
      />
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className={cn(
              "group relative p-3 rounded-lg bg-gradient-to-br border border-white/5 hover:border-white/20 transition-all overflow-hidden text-start",
              a.gradient,
            )}
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.03] transition-colors" />
            <a.icon className={cn("w-5 h-5 mb-2 transition-transform group-hover:scale-110", a.iconColor)} />
            <div className="text-xs font-medium relative">{a.label}</div>
            <ArrowUpRight className="w-3 h-3 absolute top-2.5 end-2.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-violet-300" fill="currentColor" />
          {t("shortcuts.quickDeploy")}
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/5 font-mono">N</kbd>
      </div>
    </div>
  );
}

/* ============================================================ *
 *  System Health widget — compact CPU / RAM / Disk / Network    *
 *  combined view with live progress bars and sparkline.         *
 * ============================================================ */
function SystemHealthWidget({
  t,
  cpu,
  mem,
  disk,
  net,
  locale,
}: {
  t: (k: string) => string;
  cpu: number;
  mem: number;
  disk: number;
  net: number;
  locale: "ar" | "en";
}) {
  const metrics = [
    { label: t("dashboard.cpu"), value: cpu, max: 100, unit: "%", icon: Cpu, color: "oklch(0.72 0.22 295)" },
    { label: t("dashboard.ram"), value: mem, max: 100, unit: "%", icon: MemoryStick, color: "oklch(0.78 0.17 190)" },
    { label: t("dashboard.disk"), value: disk, max: 100, unit: "%", icon: HardDrive, color: "oklch(0.75 0.2 145)" },
    { label: t("dashboard.network"), value: net, max: 1500, unit: " Mbps", icon: Wifi, color: "oklch(0.78 0.18 75)", display: net.toFixed(0) },
  ];

  return (
    <div className="lg:col-span-2 glass-card glass-card-hover p-5">
      <SectionHeader
        title={t("dashboard.systemHealth")}
        action={
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span>{t("dashboard.allSystemsOperational")}</span>
          </div>
        }
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {metrics.map((m) => {
          const pct = Math.min(100, (m.value / m.max) * 100);
          const isHigh = pct > 75;
          const isMid = pct > 50;
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-3 rounded-lg bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/[0.07] transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("w-3.5 h-3.5 transition-colors", isHigh ? "text-rose-400" : isMid ? "text-amber-400" : "")} style={{ color: !isHigh && !isMid ? m.color : undefined }} />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</span>
              </div>
              <div className="flex items-baseline gap-0.5 mb-2">
                <span className="text-lg font-semibold tabular-nums">{(m.display ?? m.value.toFixed(1))}</span>
                <span className="text-[10px] text-muted-foreground">{m.unit}</span>
              </div>
              <ProgressBar
                value={m.value}
                max={m.max}
                color={isHigh ? "oklch(0.65 0.24 25)" : isMid ? "oklch(0.78 0.18 75)" : m.color}
                className="h-1"
              />
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground/70">
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {pct.toFixed(0)}%
                </span>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity">{t("common.live")}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-muted-foreground/70">
        <span className="flex items-center gap-1.5">
          <ServerIcon className="w-3 h-3" />
          {mockServerInfo.hostname} · {mockServerInfo.cpu.cores} cores
        </span>
        <span suppressHydrationWarning>{formatUptime(mockServerInfo.uptime, locale)}</span>
      </div>
    </div>
  );
}

/* ============================================================ *
 *  Recent Activity timeline — vertical timeline of recent      *
 *  platform events (deploys, container ops, security, etc.).   *
 * ============================================================ */
function RecentActivityWidget({
  t,
  locale,
  onViewAll,
}: {
  t: (k: string) => string;
  locale: "ar" | "en";
  onViewAll: () => void;
}) {
  const items = mockActivity.slice(0, 6);

  const categoryColor: Record<string, string> = {
    deployment: "bg-violet-400",
    container: "bg-cyan-400",
    project: "bg-emerald-400",
    database: "bg-amber-400",
    auth: "bg-rose-400",
    settings: "bg-zinc-400",
    billing: "bg-sky-400",
  };

  const categoryIcon: Record<string, React.ReactNode> = {
    deployment: <Rocket className="w-3 h-3" />,
    container: <Boxes className="w-3 h-3" />,
    project: <GitBranch className="w-3 h-3" />,
    database: <HardDrive className="w-3 h-3" />,
    auth: <CheckCircle2 className="w-3 h-3" />,
    settings: <Activity className="w-3 h-3" />,
    billing: <TrendingUp className="w-3 h-3" />,
  };

  return (
    <div className="glass-card glass-card-hover p-5">
      <SectionHeader
        title={t("dashboard.recentActivity")}
        action={
          <button
            onClick={onViewAll}
            className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1"
          >
            {t("dashboard.viewAllActivity")}
            <ArrowUpRight className="w-3 h-3" />
          </button>
        }
      />
      <div className="relative">
        {/* Timeline vertical line */}
        <div className="absolute top-0 bottom-0 w-px bg-white/5 start-[15px]" aria-hidden />
        <div className="space-y-3">
          {items.map((a) => (
            <div key={a.id} className="relative flex items-start gap-3 ps-1 group">
              <div
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ring-4 ring-background",
                  categoryColor[a.category] ?? "bg-zinc-400",
                )}
              >
                {categoryIcon[a.category] ?? <Activity className="w-3 h-3" />}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {a.actor.avatarUrl ? (
                    <img src={a.actor.avatarUrl} alt="" className="w-3.5 h-3.5 rounded-full" />
                  ) : null}
                  <span className="text-xs font-medium">{a.actor.name}</span>
                  <span className="text-xs text-muted-foreground">{a.action}</span>
                  <span className="text-xs font-medium text-violet-300 truncate">{a.resource.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/70" suppressHydrationWarning>{timeAgo(a.timestamp, locale)}</span>
                  {a.metadata?.commit && (
                    <code className="text-[10px] text-muted-foreground bg-white/5 px-1 py-0. rounded font-mono">{a.metadata.commit}</code>
                  )}
                  {a.ip && (
                    <span className="text-[10px] text-muted-foreground/50 font-mono">{a.ip}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
