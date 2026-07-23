"use client";

import * as React from "react";
import {
  Plus,
  HardDrive,
  Download,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Cloud,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockBackups } from "@/lib/mock-data";
import { SectionHeader, StatusBadge } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { timeAgo, formatDuration, formatBytes } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Backup } from "@/lib/types";

const statusConfig: Record<Backup["status"], { color: string; icon: React.ElementType; label: string }> = {
  completed: { color: "text-emerald-400", icon: CheckCircle2, label: "backups.status.completed" },
  in_progress: { color: "text-violet-300", icon: Loader2, label: "backups.status.in_progress" },
  failed: { color: "text-rose-400", icon: XCircle, label: "backups.status.failed" },
  restoring: { color: "text-amber-300", icon: RotateCcw, label: "backups.status.restoring" },
};

const typeColor: Record<Backup["type"], string> = {
  automatic: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  manual: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  "pre-deploy": "bg-amber-500/10 text-amber-300 border-amber-500/20",
};

export function BackupsView() {
  const { t, locale } = useI18n();
  const [filter, setFilter] = React.useState<"all" | Backup["status"]>("all");

  const filtered = mockBackups.filter((b) => filter === "all" || b.status === filter);

  const totalSize = mockBackups.filter(b => b.status === "completed").reduce((s, b) => s + b.sizeMb, 0);
  const completedCount = mockBackups.filter(b => b.status === "completed").length;
  const failedCount = mockBackups.filter(b => b.status === "failed").length;
  const inProgressCount = mockBackups.filter(b => b.status === "in_progress").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("backups.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("backups.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("backups.create")}
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("backups.status.completed")}</div>
          <div className="text-2xl font-semibold tabular-nums text-emerald-400">{completedCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("backups.status.in_progress")}</div>
          <div className="text-2xl font-semibold tabular-nums text-violet-300">{inProgressCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("backups.status.failed")}</div>
          <div className="text-2xl font-semibold tabular-nums text-rose-400">{failedCount}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("backups.size")}</div>
          <div className="text-2xl font-semibold tabular-nums">{formatBytes(totalSize)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 w-fit">
        {(["all", "completed", "in_progress", "failed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
              filter === f ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? t("deployments.filter.all") : t(`backups.status.${f}`)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-start font-medium px-4 py-3">{t("backups.type")}</th>
                <th className="text-start font-medium px-4 py-3">{t("common.name")}</th>
                <th className="text-start font-medium px-4 py-3">{t("backups.status")}</th>
                <th className="text-end font-medium px-4 py-3">{t("backups.size")}</th>
                <th className="text-end font-medium px-4 py-3 hidden md:table-cell">{t("backups.duration")}</th>
                <th className="text-end font-medium px-4 py-3">{t("backups.startedAt")}</th>
                <th className="text-start font-medium px-4 py-3 hidden lg:table-cell">{t("backups.storageLocation")}</th>
                <th className="px-4 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const cfg = statusConfig[b.status];
                const StatusIcon = cfg.icon;
                return (
                  <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded border", typeColor[b.type])}>
                        {t(`backups.type.${b.type}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="text-xs font-medium">{b.databaseName ?? b.projectName ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
                        <StatusIcon className={cn("w-3.5 h-3.5", b.status === "in_progress" && "animate-spin")} />
                        {t(cfg.label)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-end tabular-nums text-xs">
                      {b.sizeMb > 0 ? formatBytes(b.sizeMb) : "—"}
                    </td>
                    <td className="px-4 py-3 text-end hidden md:table-cell tabular-nums text-xs">
                      {b.durationMs ? formatDuration(b.durationMs, locale) : "—"}
                    </td>
                    <td className="px-4 py-3 text-end text-xs text-muted-foreground tabular-nums" suppressHydrationWarning>
                      {timeAgo(b.startedAt, locale)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <code className="text-[10px] text-muted-foreground/70 font-mono truncate block max-w-xs">{b.storageLocation}</code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100">
                        {b.status === "completed" && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title={t("backups.restore")}>
                              <RotateCcw className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" title={t("backups.download")}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" title={t("backups.delete")}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Storage info */}
      <div className="glass-card p-4 flex items-center gap-3">
        <Cloud className="w-5 h-5 text-violet-300 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-medium">S3-compatible storage: <code className="text-xs text-violet-300">s3://railflow-backups/</code></p>
          <p className="text-xs text-muted-foreground mt-0.5">Backups stored encrypted with AES-256. Lifecycle policy: 30-day retention, then Glacier transition.</p>
        </div>
      </div>
    </div>
  );
}
