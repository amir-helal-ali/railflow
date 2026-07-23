"use client";

import * as React from "react";
import {
  Plus,
  Play,
  GitBranch,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Settings2,
  Copy,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockPipelines } from "@/lib/mock-data";
import { StatusBadge, SectionHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { timeAgo, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Pipeline, PipelineStage, PipelineStageType } from "@/lib/types";

const stageIcon: Record<PipelineStageType, React.ElementType> = {
  trigger: Zap,
  build: Settings2,
  test: CheckCircle2,
  lint: CheckCircle2,
  "security-scan": CheckCircle2,
  deploy: GitBranch,
  notify: Zap,
  custom: Settings2,
};

const stageColor: Record<PipelineStageType, string> = {
  trigger: "bg-violet-500/10 text-violet-300 border-violet-500/20",
  build: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  test: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  lint: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  "security-scan": "bg-rose-500/10 text-rose-300 border-rose-500/20",
  deploy: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  notify: "bg-pink-500/10 text-pink-300 border-pink-500/20",
  custom: "bg-zinc-500/10 text-zinc-300 border-zinc-500/20",
};

const statusIcon = {
  success: CheckCircle2,
  failed: XCircle,
  running: Loader2,
  cancelled: XCircle,
};

export function PipelinesView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [selectedId, setSelectedId] = React.useState(mockPipelines[0].id);
  const [selected, setSelected] = React.useState<Pipeline>(mockPipelines[0]);
  const [expandedStage, setExpandedStage] = React.useState<string | null>(null);

  React.useEffect(() => {
    const p = mockPipelines.find((x) => x.id === selectedId);
    if (p) setSelected(p);
  }, [selectedId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-violet-300" />
            {t("pipelines.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("pipelines.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("pipelines.new")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Pipelines list */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="space-y-1 max-h-[640px] overflow-y-auto scrollbar-thin">
            {mockPipelines.map((p) => {
              const StatusIcon = p.lastRun ? statusIcon[p.lastRun.status] : null;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className={cn(
                    "flex items-start gap-2 w-full p-2.5 rounded-lg text-start transition-colors",
                    selectedId === p.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    <Switch checked={p.enabled} />
                    {StatusIcon && (
                      <StatusIcon className={cn("w-3.5 h-3.5", p.lastRun?.status === "running" && "animate-spin", p.lastRun?.status === "success" ? "text-emerald-400" : p.lastRun?.status === "failed" ? "text-rose-400" : "text-violet-300")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{p.projectName}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                      <span className="tabular-nums">{p.stats.totalRuns}</span>
                      <span>·</span>
                      <span className="tabular-nums">{p.stats.successRate}%</span>
                      {p.lastRun && (
                        <>
                          <span>·</span>
                          <span suppressHydrationWarning>{timeAgo(p.lastRun.startedAt, locale)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pipeline detail */}
        <div className="lg:col-span-3 space-y-4">
          {/* Header */}
          <div className="glass-card p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold">{selected.name}</h2>
                  <StatusBadge status={selected.enabled ? "running" : "stopped"} />
                </div>
                <button
                  onClick={() => navigate({ name: "project", projectId: selected.projectId })}
                  className="text-xs text-muted-foreground hover:text-violet-300 transition-colors"
                >
                  {selected.projectName} →
                </button>
              </div>
              <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
                <Play className="w-3.5 h-3.5" />
                {t("pipelines.runNow")}
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3">
              <Stat label={t("pipelines.totalRuns")} value={selected.stats.totalRuns} />
              <Stat label={t("pipelines.successRate")} value={`${selected.stats.successRate}%`} color={selected.stats.successRate > 95 ? "text-emerald-400" : "text-amber-400"} />
              <Stat label={t("pipelines.avgDuration")} value={formatDuration(selected.stats.avgDurationMs, locale)} />
              <Stat label={t("pipelines.last24h")} value={selected.stats.last24h} />
            </div>

            {/* Last run info */}
            {selected.lastRun && (
              <div className="mt-3 p-3 rounded-lg bg-white/5 flex items-center gap-3 text-xs">
                <StatusBadge status={selected.lastRun.status === "success" ? "done" : selected.lastRun.status === "failed" ? "failed" : "building"} />
                <span className="text-muted-foreground">{t("pipelines.lastRun")}:</span>
                <span suppressHydrationWarning>{timeAgo(selected.lastRun.startedAt, locale)}</span>
                <span className="text-muted-foreground">·</span>
                <span>{selected.lastRun.durationMs ? formatDuration(selected.lastRun.durationMs, locale) : t("common.live")}</span>
                <span className="text-muted-foreground">·</span>
                <span>{selected.lastRun.triggeredBy}</span>
              </div>
            )}
          </div>

          {/* Trigger config */}
          <div className="glass-card p-5">
            <SectionHeader title={t("pipelines.trigger")} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("pipelines.trigger.events")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.trigger.events.map((ev) => (
                    <span key={ev} className="text-[10px] px-2 py-1 rounded-md bg-violet-500/10 text-violet-300 border border-violet-500/20 flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5" />
                      {t(`pipelines.event.${ev}`)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("pipelines.trigger.branches")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {selected.trigger.branches.map((b) => (
                    <span key={b} className="text-[10px] font-mono px-2 py-1 rounded-md bg-white/5 text-foreground border border-white/10 flex items-center gap-1">
                      <GitBranch className="w-2.5 h-2.5" />
                      {b}
                    </span>
                  ))}
                </div>
              </div>
              {selected.trigger.schedule && (
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("pipelines.trigger.schedule")}</label>
                  <code className="text-xs font-mono px-2 py-1 rounded-md bg-white/5 text-cyan-300 border border-white/10">
                    {selected.trigger.schedule}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Stages visualization */}
          <div className="glass-card p-5">
            <SectionHeader
              title={t("pipelines.stages")}
              subtitle={`${selected.stages.length} ${t("pipelines.stages").toLowerCase()}`}
              action={
                <Button variant="outline" size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  {t("pipelines.addStage")}
                </Button>
              }
            />
            <div className="space-y-2">
              {selected.stages.map((stage, idx) => {
                const Icon = stageIcon[stage.type];
                const isExpanded = expandedStage === stage.id;
                return (
                  <div key={stage.id}>
                    <div
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                        stage.enabled ? "bg-white/[0.03] border-white/10" : "bg-white/[0.01] border-white/5 opacity-60"
                      )}
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground/40 cursor-grab shrink-0" />
                      <div className="flex items-center text-muted-foreground/40 text-[10px] font-mono w-6 shrink-0">{idx + 1}</div>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border shrink-0", stageColor[stage.type])}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{stage.name}</span>
                          <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", stageColor[stage.type])}>
                            {t(`pipelines.stage.type.${stage.type}`)}
                          </span>
                          {stage.condition && (
                            <code className="text-[10px] font-mono text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded">
                              if: {stage.condition}
                            </code>
                          )}
                        </div>
                        {stage.command && (
                          <code className="text-[11px] font-mono text-muted-foreground truncate block mt-0.5">{stage.command}</code>
                        )}
                      </div>
                      {stage.timeoutSec && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {stage.timeoutSec}s
                        </div>
                      )}
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded shrink-0",
                        stage.onFailure === "stop" ? "bg-rose-500/10 text-rose-300" :
                        stage.onFailure === "retry" ? "bg-amber-500/10 text-amber-300" :
                        "bg-white/5 text-muted-foreground"
                      )}>
                        {t(`pipelines.stage.onFailure.${stage.onFailure}`)}
                      </span>
                      <Switch checked={stage.enabled} />
                      <button
                        onClick={() => setExpandedStage(isExpanded ? null : stage.id)}
                        className="text-muted-foreground hover:text-foreground shrink-0"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="p-3 ms-9 me-9 rounded-b-lg bg-black/30 border border-t-0 border-white/5 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t("pipelines.stage.command")}</label>
                            <Input defaultValue={stage.command ?? ""} className="bg-white/5 border-white/10 font-mono text-xs h-8" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t("pipelines.stage.image")}</label>
                            <Input defaultValue={stage.image ?? ""} className="bg-white/5 border-white/10 font-mono text-xs h-8" placeholder="node:22-alpine" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t("pipelines.stage.timeout")} (s)</label>
                            <Input type="number" defaultValue={stage.timeoutSec ?? 60} className="bg-white/5 border-white/10 tabular-nums h-8" />
                          </div>
                          <div>
                            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">{t("pipelines.stage.condition")}</label>
                            <Input defaultValue={stage.condition ?? ""} className="bg-white/5 border-white/10 font-mono text-xs h-8" placeholder="branch == 'main'" />
                          </div>
                        </div>
                      </div>
                    )}
                    {idx < selected.stages.length - 1 && (
                      <div className="flex items-center justify-center py-1">
                        <ArrowRight className="w-3 h-3 text-muted-foreground/40 rotate-90 rtl:rotate-[-90deg]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
              <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
                <CheckCircle2 className="w-4 h-4" />
                {t("pipelines.save")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-white/5">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn("text-sm font-semibold tabular-nums mt-0.5", color)}>{value}</div>
    </div>
  );
}
