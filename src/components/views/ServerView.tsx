"use client";

import * as React from "react";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Network as NetworkIcon,
  Server as ServerIcon,
  Activity,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockServerInfo, mockProcesses, generateMultiSeries } from "@/lib/mock-data";
import { SectionHeader, ProgressBar } from "@/components/dashboard/shared";
import { AreaTimeChart, RadialGauge } from "@/components/charts";
import { formatUptime, formatBytes, formatMbps, useInterval } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ServerView() {
  const { t, locale } = useI18n();
  const [series, setSeries] = React.useState<ReturnType<typeof generateMultiSeries> | null>(null);
  const [perCore, setPerCore] = React.useState<number[]>(mockServerInfo.cpu.perCoreUsage);
  React.useEffect(() => {
    setSeries(generateMultiSeries());
  }, []);
  useInterval(() => {
    setSeries(generateMultiSeries());
    setPerCore(mockServerInfo.cpu.perCoreUsage.map((v) => Math.max(5, Math.min(95, v + (Math.random() - 0.5) * 10))));
  }, 5000);

  const s = mockServerInfo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("server.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("server.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card text-xs">
          <span className="relative inline-flex">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-400" />
          </span>
          <span className="text-muted-foreground">{t("common.live")} · {s.hostname}</span>
        </div>
      </div>

      {/* System info bar */}
      <div className="glass-card p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground uppercase tracking-wider mb-0.5">{t("server.hostname")}</div>
            <div className="font-mono font-medium">{s.hostname}</div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase tracking-wider mb-0.5">{t("server.os")}</div>
            <div className="font-medium">{s.os}</div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase tracking-wider mb-0.5">{t("server.kernel")}</div>
            <div className="font-mono font-medium">{s.kernel}</div>
          </div>
          <div>
            <div className="text-muted-foreground uppercase tracking-wider mb-0.5">{t("server.uptime")}</div>
            <div className="font-medium tabular-nums">{formatUptime(s.uptime, locale)}</div>
          </div>
        </div>
      </div>

      {/* Top metrics with gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex flex-col items-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Cpu className="w-3 h-3" /> {t("dashboard.cpuUsage")}
          </div>
          <RadialGauge value={s.cpu.overallUsage} label={t("common.live")} size={140} color="oklch(0.72 0.22 295)" />
          <div className="mt-3 text-center text-xs text-muted-foreground">
            {t("server.cpu.loadAvg")}: <span className="tabular-nums text-foreground">{s.cpu.loadAvg1.toFixed(2)} / {s.cpu.loadAvg5.toFixed(2)} / {s.cpu.loadAvg15.toFixed(2)}</span>
          </div>
        </div>
        <div className="glass-card p-5 flex flex-col items-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MemoryStick className="w-3 h-3" /> {t("dashboard.memoryUsage")}
          </div>
          <RadialGauge value={(s.memory.usedGb / s.memory.totalGb) * 100} label={`${s.memory.usedGb.toFixed(1)} / ${s.memory.totalGb} GB`} size={140} color="oklch(0.78 0.17 190)" />
          <div className="mt-3 text-center text-xs text-muted-foreground">
            Swap: <span className="tabular-nums text-foreground">{s.memory.swapUsedGb.toFixed(1)} / {s.memory.swapTotalGb} GB</span>
          </div>
        </div>
        <div className="glass-card p-5 flex flex-col items-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <HardDrive className="w-3 h-3" /> {t("dashboard.diskUsage")}
          </div>
          <RadialGauge value={(s.disk.usedGb / s.disk.totalGb) * 100} label={`${s.disk.usedGb} / ${s.disk.totalGb} GB`} size={140} color="oklch(0.75 0.2 145)" />
          <div className="mt-3 text-center text-xs text-muted-foreground">
            Docker: <span className="tabular-nums text-foreground">{s.docker.containersRunning}/{s.docker.containersTotal}</span>
          </div>
        </div>
        <div className="glass-card p-5 flex flex-col items-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <NetworkIcon className="w-3 h-3" /> {t("dashboard.networkThroughput")}
          </div>
          <div className="flex-1 flex flex-col justify-center items-center gap-3 w-full py-3">
            <div className="text-center">
              <div className="text-xs text-emerald-400 flex items-center gap-1 justify-center">
                <span>↓</span>
                <span className="text-xl font-semibold tabular-nums">{formatMbps(s.network.interfaces[0].inboundMbps)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{t("server.network.inbound")}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-violet-300 flex items-center gap-1 justify-center">
                <span>↑</span>
                <span className="text-xl font-semibold tabular-nums">{formatMbps(s.network.interfaces[0].outboundMbps)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">{t("server.network.outbound")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Time series charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title={`${t("dashboard.cpuUsage")} — ${t("server.history")}`} />
          {series && <AreaTimeChart series={[series.cpu]} height={200} unit="%" />}
          {!series && <div className="h-[200px] shimmer rounded-lg" />}
        </div>
        <div className="glass-card p-5">
          <SectionHeader title={`${t("dashboard.memoryUsage")} — ${t("server.history")}`} />
          {series && <AreaTimeChart series={[series.memory]} height={200} unit="%" />}
          {!series && <div className="h-[200px] shimmer rounded-lg" />}
        </div>
      </div>

      {/* CPU per core */}
      <div className="glass-card p-5">
        <SectionHeader title={t("server.cpu.perCore")} subtitle={`${s.cpu.model} · ${s.cpu.cores} cores @ ${s.cpu.frequencyMhz} MHz`} />
        <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-16 gap-3">
          {perCore.map((usage, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="relative w-12 h-20 rounded-lg bg-white/5 overflow-hidden flex items-end">
                <div
                  className={cn(
                    "w-full rounded-t-md transition-all duration-500",
                    usage > 80 ? "bg-rose-500" : usage > 60 ? "bg-amber-400" : usage > 30 ? "bg-violet-400" : "bg-emerald-400"
                  )}
                  style={{ height: `${usage}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground tabular-nums">#{i + 1}</span>
              <span className="text-[10px] font-medium tabular-nums">{usage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Partitions + Network interfaces */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <SectionHeader title={t("server.disk.partitions")} subtitle={`${s.disk.usedGb} / ${s.disk.totalGb} GB used`} />
          <div className="space-y-3">
            {s.disk.partitions.map((p) => (
              <div key={p.device}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono text-violet-300">{p.mount}</code>
                    <span className="text-[10px] text-muted-foreground">{p.device} · {p.fsType}</span>
                  </div>
                  <div className="text-xs tabular-nums">
                    <span className="font-medium">{p.usedGb} GB</span>
                    <span className="text-muted-foreground"> / {p.totalGb} GB</span>
                  </div>
                </div>
                <ProgressBar
                  value={p.usedPercent}
                  color={p.usedPercent > 80 ? "oklch(0.7 0.24 25)" : p.usedPercent > 60 ? "oklch(0.78 0.18 75)" : "linear-gradient(90deg, oklch(0.72 0.22 295), oklch(0.78 0.17 190))"}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionHeader title={t("server.network.interfaces")} />
          <div className="space-y-3">
            {s.network.interfaces.map((iface) => (
              <div key={iface.name} className={cn("p-3 rounded-lg border", iface.isUp ? "bg-white/5 border-white/10" : "bg-white/[0.02] border-white/5 opacity-60")}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <NetworkIcon className={cn("w-4 h-4", iface.isUp ? "text-emerald-400" : "text-muted-foreground")} />
                    <code className="text-sm font-mono font-medium">{iface.name}</code>
                    {!iface.isUp && <span className="text-[10px] text-muted-foreground uppercase">DOWN</span>}
                  </div>
                  <code className="text-xs font-mono text-muted-foreground">{iface.ip}</code>
                </div>
                {iface.isUp && (
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">↓ {t("server.network.inbound")}</span>
                      <span className="font-medium tabular-nums text-emerald-400">{formatMbps(iface.inboundMbps)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">↑ {t("server.network.outbound")}</span>
                      <span className="font-medium tabular-nums text-violet-300">{formatMbps(iface.outboundMbps)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total ↓</span>
                      <span className="tabular-nums">{iface.totalInGb.toFixed(1)} GB</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total ↑</span>
                      <span className="tabular-nums">{iface.totalOutGb.toFixed(1)} GB</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top processes */}
      <div className="glass-card p-5">
        <SectionHeader
          title={t("server.processes")}
          subtitle={`${mockProcesses.length} processes · sorted by CPU`}
          action={<Activity className="w-4 h-4 text-muted-foreground" />}
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-start font-medium px-3 py-2.5 w-16">PID</th>
                <th className="text-start font-medium px-3 py-2.5">Name</th>
                <th className="text-start font-medium px-3 py-2.5 hidden md:table-cell">{t("server.processes.user")}</th>
                <th className="text-end font-medium px-3 py-2.5 w-20">{t("server.processes.cpu")}</th>
                <th className="text-end font-medium px-3 py-2.5 w-24 hidden md:table-cell">{t("server.processes.memory")}</th>
                <th className="text-start font-medium px-3 py-2.5 hidden lg:table-cell">{t("server.processes.command")}</th>
              </tr>
            </thead>
            <tbody>
              {[...mockProcesses].sort((a, b) => b.cpuPercent - a.cpuPercent).slice(0, 12).map((p) => (
                <tr key={p.pid} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 text-xs font-mono text-muted-foreground tabular-nums">{p.pid}</td>
                  <td className="px-3 py-2.5">
                    <span className="font-medium text-sm">{p.name}</span>
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">{p.user}</td>
                  <td className="px-3 py-2.5 text-end">
                    <span className={cn(
                      "tabular-nums font-medium",
                      p.cpuPercent > 20 ? "text-rose-400" : p.cpuPercent > 5 ? "text-amber-400" : "text-foreground"
                    )}>
                      {p.cpuPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-end hidden md:table-cell">
                    <div className="tabular-nums">
                      <span className="text-sm">{p.memoryMb.toFixed(0)} MB</span>
                      <span className="text-[10px] text-muted-foreground block">{p.memoryPercent.toFixed(2)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 hidden lg:table-cell max-w-md">
                    <code className="text-[10px] font-mono text-muted-foreground truncate block">{p.command}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
