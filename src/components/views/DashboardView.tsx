"use client";

import * as React from "react";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Server as ServerIcon,
  Rocket,
  Boxes,
  GitBranch,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import {
  mockProjects,
  mockContainers,
  mockDeployments,
  mockServerInfo,
  mockDockerEvents,
  generateMultiSeries,
} from "@/lib/mock-data";
import { MetricCard, StatusBadge, SectionHeader, Sparkline } from "@/components/dashboard/shared";
import { AreaTimeChart, BarCountChart, RadialGauge } from "@/components/charts";
import { formatUptime, timeAgo, useInterval } from "@/lib/format";
import { cn } from "@/lib/utils";

export function DashboardView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();

  // Generate series only on client to avoid hydration mismatch from Math.random
  const [series, setSeries] = React.useState<ReturnType<typeof generateMultiSeries> | null>(null);
  React.useEffect(() => {
    setSeries(generateMultiSeries());
  }, []);
  useInterval(() => setSeries(generateMultiSeries()), 10_000);

  // Until client-side series are generated, use empty placeholders
  const cpuSeries = series?.cpu;
  const memSeries = series?.memory;
  const netSeries = series?.network;
  const deploySeries = series?.deployments;
  const sparkCpu = cpuSeries?.points.map((p) => p.value) ?? [];
  const sparkMem = memSeries?.points.map((p) => p.value) ?? [];
  const sparkDeploy = deploySeries?.points.map((p) => p.value) ?? [];

  const activeProjects = mockProjects.filter((p) => p.status === "done").length;
  const runningContainers = mockContainers.filter((c) => c.status === "running").length;
  const activeDeployments = mockDeployments.filter((d) => d.status === "building" || d.status === "queued").length;
  const failedDeploys = mockDeployments.filter((d) => d.status === "failed").length;

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
          value={mockServerInfo.cpu.overallUsage.toFixed(1)}
          unit="%"
          delta={{ value: 3.2, positive: false }}
          spark={sparkCpu}
          color="oklch(0.75 0.2 145)"
          icon={<Cpu className="w-4 h-4" />}
        />
        <MetricCard
          label={t("dashboard.memoryUsage")}
          value={((mockServerInfo.memory.usedGb / mockServerInfo.memory.totalGb) * 100).toFixed(0)}
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
        <div className="lg:col-span-2 glass-card p-5">
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
        <div className="glass-card p-5">
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
        <div className="lg:col-span-2 glass-card p-5">
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
        <div className="glass-card p-5">
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
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{c.name}</span>
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
        <div className="glass-card p-5">
          <SectionHeader title={t("dashboard.deploymentActivity")} subtitle={t("server.history")} />
          <BarCountChart data={hourlyDeploys} height={160} />
        </div>

        {/* System events */}
        <div className="lg:col-span-2 glass-card p-5">
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

      {/* Server quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">CPU</div>
            <div className="text-sm font-semibold tabular-nums">{mockServerInfo.cpu.cores} cores</div>
            <div className="text-[10px] text-muted-foreground">{mockServerInfo.cpu.model.split(" ").slice(0, 3).join(" ")}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
            <MemoryStick className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">RAM</div>
            <div className="text-sm font-semibold tabular-nums">{mockServerInfo.memory.usedGb.toFixed(1)} / {mockServerInfo.memory.totalGb} GB</div>
            <div className="text-[10px] text-muted-foreground">{((mockServerInfo.memory.usedGb / mockServerInfo.memory.totalGb) * 100).toFixed(0)}% used</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">DISK</div>
            <div className="text-sm font-semibold tabular-nums">{mockServerInfo.disk.usedGb} / {mockServerInfo.disk.totalGb} GB</div>
            <div className="text-[10px] text-muted-foreground">{((mockServerInfo.disk.usedGb / mockServerInfo.disk.totalGb) * 100).toFixed(0)}% used</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <ServerIcon className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">UPTIME</div>
            <div className="text-sm font-semibold tabular-nums">{formatUptime(mockServerInfo.uptime, locale)}</div>
            <div className="text-[10px] text-muted-foreground">{mockServerInfo.hostname}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
