"use client";

import * as React from "react";
import { Rocket, Filter, GitBranch, ExternalLink, AlertTriangle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockDeployments } from "@/lib/mock-data";
import { StatusBadge, SectionHeader, EmptyState } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { timeAgo, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Deployment } from "@/lib/types";

export function DeploymentsView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [filter, setFilter] = React.useState<"all" | "done" | "failed" | "building">("all");
  const [selected, setSelected] = React.useState<Deployment | null>(mockDeployments[0]);

  const filtered = mockDeployments.filter((d) => filter === "all" || d.status === filter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("deployments.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("deployments.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Rocket className="w-4 h-4" />
          {t("deployments.trigger")}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {([
            { id: "all", label: t("deployments.filter.all") },
            { id: "done", label: t("deployments.filter.success") },
            { id: "building", label: t("deployments.filter.running") },
            { id: "failed", label: t("deployments.filter.failed") },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filter === f.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* List */}
        <div className="lg:col-span-3 glass-card p-3">
          <div className="space-y-1 max-h-[700px] overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <EmptyState title={t("common.noData")} />
            ) : (
              filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelected(d)}
                  className={cn(
                    "flex items-start gap-3 w-full p-3 rounded-lg text-start transition-colors",
                    selected?.id === d.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <img src={d.authorAvatar} alt={d.author} className="w-9 h-9 rounded-full ring-1 ring-white/10 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm truncate">{d.projectName}</span>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{d.commitMessage}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                      <code className="text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">{d.commitSha}</code>
                      <span className="flex items-center gap-0.5">
                        <GitBranch className="w-2.5 h-2.5" />
                        {d.branch}
                      </span>
                      <span>{d.author}</span>
                      <span suppressHydrationWarning>{timeAgo(d.startedAt, locale)}</span>
                      {d.durationMs && <span>· {formatDuration(d.durationMs, locale)}</span>}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-2 glass-card p-5">
          {selected ? <DeploymentDetail deployment={selected} /> : <EmptyState title={t("common.noData")} />}
        </div>
      </div>
    </div>
  );
}

function DeploymentDetail({ deployment }: { deployment: Deployment }) {
  const { t, locale } = useI18n();
  const stageLabels: Record<string, string> = {
    queued: t("deployments.stage.queued"),
    cloning: t("deployments.stage.cloning"),
    building: t("deployments.stage.building"),
    pushing: t("deployments.stage.pushing"),
    starting: t("deployments.stage.starting"),
    health: t("deployments.stage.health"),
    done: t("deployments.stage.done"),
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <code className="text-sm text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded font-mono">{deployment.commitSha}</code>
          <StatusBadge status={deployment.status} />
        </div>
        <p className="text-sm font-medium">{deployment.commitMessage}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {deployment.projectName} · {deployment.branch} · {deployment.environment}
        </p>
      </div>

      {deployment.errorMessage && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-rose-300">Build failed</p>
            <p className="text-xs text-rose-300/70 mt-0.5 font-mono">{deployment.errorMessage}</p>
          </div>
        </div>
      )}

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("deployments.pipeline")}</h4>
        <div className="space-y-2">
          {deployment.stages.map((stage) => (
            <div key={stage.id} className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0",
                stage.status === "success" && "bg-emerald-500/20 text-emerald-300",
                stage.status === "running" && "bg-violet-500/20 text-violet-300",
                stage.status === "failed" && "bg-rose-500/20 text-rose-300",
                stage.status === "pending" && "bg-white/5 text-muted-foreground",
                stage.status === "skipped" && "bg-white/5 text-muted-foreground/50"
              )}>
                {stage.status === "success" && "✓"}
                {stage.status === "failed" && "✗"}
                {stage.status === "running" && <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />}
                {stage.status === "pending" && "○"}
                {stage.status === "skipped" && "—"}
              </div>
              <span className={cn(
                "text-sm flex-1",
                stage.status === "pending" || stage.status === "skipped" ? "text-muted-foreground/60" : "text-foreground"
              )}>
                {stageLabels[stage.id] || stage.id}
              </span>
              {stage.status === "running" && (
                <span className="text-[10px] text-violet-300">running…</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {deployment.url && (
        <a href={deployment.url} target="_blank" rel="noreferrer" className="block">
          <Button variant="outline" size="sm" className="w-full">
            <ExternalLink className="w-3.5 h-3.5" />
            {deployment.url}
          </Button>
        </a>
      )}
    </div>
  );
}
