"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { ContainerStatus, DeploymentStatus, Health } from "@/lib/types";
import { useI18n } from "@/lib/i18n";

/** Tiny inline status pill with colored dot */
export function StatusBadge({
  status,
  className,
}: {
  status: ContainerStatus | DeploymentStatus | Health;
  className?: string;
}) {
  const { t } = useI18n();
  const map: Record<string, { color: string; key: string }> = {
    running: { color: "bg-emerald-400", key: "status.running" },
    done: { color: "bg-emerald-400", key: "status.success" },
    success: { color: "bg-emerald-400", key: "status.success" },
    healthy: { color: "bg-emerald-400", key: "status.healthy" },
    online: { color: "bg-emerald-400", key: "status.online" },
    building: { color: "bg-amber-400", key: "status.building" },
    deploying: { color: "bg-amber-400", key: "status.deploying" },
    restarting: { color: "bg-amber-400", key: "status.restarting" },
    queued: { color: "bg-sky-400", key: "status.queued" },
    pending: { color: "bg-sky-400", key: "status.pending" },
    cloning: { color: "bg-sky-400", key: "status.queued" },
    pushing: { color: "bg-violet-400", key: "status.deploying" },
    starting: { color: "bg-violet-400", key: "status.deploying" },
    health: { color: "bg-violet-400", key: "status.deploying" },
    stopped: { color: "bg-zinc-500", key: "status.stopped" },
    paused: { color: "bg-zinc-500", key: "status.paused" },
    offline: { color: "bg-zinc-500", key: "status.offline" },
    unknown: { color: "bg-zinc-500", key: "common.noData" },
    failed: { color: "bg-rose-500", key: "status.failed" },
    unhealthy: { color: "bg-rose-500", key: "status.unhealthy" },
    degraded: { color: "bg-amber-400", key: "status.unhealthy" },
  };
  const { color, key } = map[status] ?? map.unknown;
  const pulse = ["running", "done", "success", "healthy", "online", "building", "deploying", "restarting", "queued", "pending", "cloning", "pushing", "starting", "health"].includes(status);

  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-0.5 text-xs font-medium bg-white/5 border border-white/10", className)}>
      <span className="relative inline-flex">
        <span className={cn("inline-block w-1.5 h-1.5 rounded-full", color)} />
        {pulse && <span className={cn("absolute inset-0 rounded-full animate-ping opacity-60", color)} />}
      </span>
      {t(key)}
    </span>
  );
}

/** Sparkline — tiny inline chart */
export function Sparkline({
  data,
  color = "oklch(0.72 0.22 295)",
  height = 32,
  width = 100,
  fill = true,
}: {
  data: number[];
  color?: string;
  height?: number;
  width?: number;
  fill?: boolean;
}) {
  const id = React.useId();
  if (data.length < 2) return <svg width={width} height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const areaPath = `${path} L${width},${height} L0,${height} Z`;
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.3} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#spark-${id})`} />}
      <path d={path} stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Stat card with title, value, optional sparkline & delta */
export function MetricCard({
  label,
  value,
  unit,
  delta,
  spark,
  color = "oklch(0.72 0.22 295)",
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: { value: number; positive?: boolean };
  spark?: number[];
  color?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="glass-card glass-card-hover p-4 relative overflow-hidden">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</div>
        {icon && <div className="text-muted-foreground/60">{icon}</div>}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums">{value}</span>
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
      </div>
      <div className="flex items-center justify-between mt-3">
        {delta ? (
          <span className={cn("text-xs font-medium", delta.positive ? "text-emerald-400" : "text-rose-400")}>
            {delta.positive ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
          </span>
        ) : (
          <span />
        )}
        {spark && spark.length > 1 && (
          <Sparkline data={spark} color={color} width={90} height={28} />
        )}
      </div>
    </div>
  );
}

/** Progress bar */
export function ProgressBar({
  value,
  max = 100,
  color,
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={cn("h-1.5 rounded-full bg-white/5 overflow-hidden", className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${pct}%`,
          background: color ?? "linear-gradient(90deg, oklch(0.72 0.22 295), oklch(0.78 0.17 190))",
        }}
      />
    </div>
  );
}

/** Section header */
export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Empty state */
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground/40">{icon}</div>}
      <h3 className="text-base font-medium mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
