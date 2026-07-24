"use client";

import * as React from "react";
import {
  Plus,
  Activity,
  Globe,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockApiHealthChecks, generateApiMetrics } from "@/lib/mock-data";
import { SectionHeader, ProgressBar, Sparkline } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { LineTimeChart } from "@/components/charts";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ApiHealthCheck } from "@/lib/types";

const statusConfig: Record<ApiHealthCheck["status"], { color: string; bg: string; icon: React.ElementType; label: string }> = {
  up: { color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2, label: "apiHealth.status.up" },
  down: { color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: XCircle, label: "apiHealth.status.down" },
  degraded: { color: "text-amber-300", bg: "bg-amber-500/10 border-amber-500/20", icon: AlertTriangle, label: "apiHealth.status.degraded" },
};

export function ApiHealthView() {
  const { t, locale } = useI18n();
  const [selectedId, setSelectedId] = React.useState(mockApiHealthChecks[0].id);
  const [metrics] = React.useState(() => generateApiMetrics(24));

  const selected = mockApiHealthChecks.find((c) => c.id === selectedId)!;

  const totalChecks = mockApiHealthChecks.length;
  const upCount = mockApiHealthChecks.filter((c) => c.status === "up").length;
  const downCount = mockApiHealthChecks.filter((c) => c.status === "down").length;
  const avgUptime = mockApiHealthChecks.reduce((sum, c) => sum + c.uptime30d, 0) / totalChecks;

  const totalRequests = metrics.reduce((sum, m) => sum + m.requests, 0);
  const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0);
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-300" />
            {t("apiHealth.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("apiHealth.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("apiHealth.new")}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total checks</div>
          <div className="text-2xl font-semibold tabular-nums">{totalChecks}</div>
        </div>
        <div className="glass-card p-4 border-emerald-500/20">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Up</div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-400">{upCount}</div>
        </div>
        <div className="glass-card p-4 border-rose-500/20">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Down</div>
          <div className="text-2xl font-semibold tabular-nums text-rose-400">{downCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Avg uptime (30d)</div>
          <div className="text-2xl font-semibold tabular-nums">{avgUptime.toFixed(2)}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Health checks list */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="space-y-1 max-h-[640px] overflow-y-auto scrollbar-thin">
            {mockApiHealthChecks.map((hc) => {
              const cfg = statusConfig[hc.status];
              const StatusIcon = cfg.icon;
              return (
                <button
                  key={hc.id}
                  onClick={() => setSelectedId(hc.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-lg text-start transition-colors",
                    selectedId === hc.id ? "bg-white/10" : "hover:bg-white/5",
                    !hc.enabled && "opacity-50"
                  )}
                >
                  <StatusIcon className={cn("w-4 h-4 shrink-0", cfg.color)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{hc.name}</p>
                    <code className="text-[10px] text-muted-foreground font-mono truncate block">{hc.url.replace("https://", "")}</code>
                  </div>
                  <div className="text-end shrink-0">
                    <div className={cn("text-xs font-mono tabular-nums", hc.uptime30d > 99 ? "text-emerald-400" : hc.uptime30d > 95 ? "text-amber-400" : "text-rose-400")}>
                      {hc.uptime30d.toFixed(2)}%
                    </div>
                    <div className="text-[10px] text-muted-foreground tabular-nums">{hc.responseTimeMs}ms</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 space-y-4">
          {/* Endpoint info */}
          <div className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded border flex items-center gap-1", statusConfig[selected.status].bg, statusConfig[selected.status].color)}>
                    {t(statusConfig[selected.status].label)}
                  </span>
                </div>
                <a href={selected.url} target="_blank" rel="noreferrer" className="text-xs text-violet-300 hover:text-violet-200 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <code className="font-mono">{selected.url}</code>
                </a>
              </div>
              <div className="text-end">
                <div className="text-2xl font-bold tabular-nums">{selected.responseTimeMs}ms</div>
                <div className="text-[10px] text-muted-foreground">{t("apiHealth.responseTime")}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <div className="p-2.5 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.method")}</div>
                <div className="text-sm font-mono font-semibold">{selected.method}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.interval")}</div>
                <div className="text-sm font-semibold tabular-nums">{selected.intervalSec}s</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.lastCheck")}</div>
                <div className="text-sm font-semibold" suppressHydrationWarning>{timeAgo(selected.lastCheck, locale)}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.lastIncident")}</div>
                <div className="text-sm font-semibold" suppressHydrationWarning>{selected.lastIncident ? timeAgo(selected.lastIncident, locale) : "—"}</div>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">{t("apiHealth.regions")}</span>
                <div className="flex gap-1">
                  {selected.regions.map((r) => (
                    <span key={r} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-cyan-300">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Traffic metrics */}
          <div className="glass-card p-5">
            <SectionHeader title={t("apiHealth.metrics")} />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.requests")}</div>
                <div className="text-xl font-semibold tabular-nums">{totalRequests.toLocaleString()}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.errors")}</div>
                <div className="text-xl font-semibold tabular-nums text-rose-400">{totalErrors}</div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.errorRate")}</div>
                <div className={cn("text-xl font-semibold tabular-nums", errorRate > 1 ? "text-rose-400" : "text-emerald-400")}>
                  {errorRate.toFixed(2)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-[10px] text-muted-foreground uppercase">{t("apiHealth.p95")}</div>
                <div className="text-xl font-semibold tabular-nums">
                  {Math.round(metrics.reduce((s, m) => s + m.p95ResponseMs, 0) / metrics.length)}ms
                </div>
              </div>
            </div>
            <LineTimeChart
              series={[
                { name: "p95", points: metrics.map((m) => ({ timestamp: m.timestamp, value: m.p95ResponseMs })), unit: "ms", color: "oklch(0.72 0.22 295)" },
                { name: "p99", points: metrics.map((m) => ({ timestamp: m.timestamp, value: m.p99ResponseMs })), unit: "ms", color: "oklch(0.78 0.17 190)" },
              ]}
              height={180}
            />
          </div>

          {/* 30-day history sparkline */}
          <div className="glass-card p-5">
            <SectionHeader title={t("apiHealth.history")} subtitle={`${selected.history.length} days`} />
            <div className="flex items-end gap-1 h-20">
              {selected.history.slice().reverse().map((h, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-t transition-all hover:opacity-80",
                    h.status === "up" ? "bg-emerald-400/60" : "bg-rose-400/60"
                  )}
                  style={{ height: `${Math.max(4, (h.responseTimeMs / 1500) * 100)}%` }}
                  title={`${new Date(h.timestamp).toLocaleDateString("en-GB")} · ${h.responseTimeMs}ms`}
                />
              ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
