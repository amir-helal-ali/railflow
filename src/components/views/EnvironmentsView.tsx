"use client";

import * as React from "react";
import {
  Plus,
  Globe,
  Moon,
  Sun,
  ArrowUpCircle,
  Trash2,
  GitBranch,
  Cpu,
  MemoryStick,
  Layers,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockEnvironments, mockProjects } from "@/lib/mock-data";
import { StatusBadge, SectionHeader, EmptyState } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { EnvironmentTier } from "@/lib/types";

const tierConfig: Record<EnvironmentTier, { color: string; icon: React.ElementType }> = {
  production: { color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20", icon: Sun },
  staging: { color: "bg-amber-500/10 text-amber-300 border-amber-500/20", icon: Layers },
  preview: { color: "bg-violet-500/10 text-violet-300 border-violet-500/20", icon: GitBranch },
};

export function EnvironmentsView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [filter, setFilter] = React.useState<"all" | EnvironmentTier>("all");

  const filtered = mockEnvironments.filter((e) => filter === "all" || e.tier === filter);

  const counts = {
    all: mockEnvironments.length,
    production: mockEnvironments.filter((e) => e.tier === "production").length,
    staging: mockEnvironments.filter((e) => e.tier === "staging").length,
    preview: mockEnvironments.filter((e) => e.tier === "preview").length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-violet-300" />
            {t("environments.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("environments.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Plus className="w-4 h-4" />
          {t("environments.new")}
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {([
            { id: "all", label: t("alerts.all"), count: counts.all },
            { id: "production", label: t("environments.tier.production"), count: counts.production },
            { id: "staging", label: t("environments.tier.staging"), count: counts.staging },
            { id: "preview", label: t("environments.tier.preview"), count: counts.preview },
          ] as const).map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                filter === f.id ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              <span className="text-[10px] text-muted-foreground/70 tabular-nums">{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Environments grouped by project */}
      <div className="space-y-6">
        {mockProjects.map((project) => {
          const envs = filtered.filter((e) => e.projectId === project.id);
          if (envs.length === 0) return null;
          return (
            <div key={project.id}>
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => navigate({ name: "project", projectId: project.id })}
                  className="text-sm font-semibold hover:text-violet-300 transition-colors"
                >
                  {project.name}
                </button>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{envs.length} {t("environments.title").toLowerCase()}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {envs.map((env) => {
                  const cfg = tierConfig[env.tier];
                  const TierIcon = cfg.icon;
                  return (
                    <div
                      key={env.id}
                      className={cn(
                        "glass-card p-4 transition-all",
                        env.status === "failed" && "border-rose-500/30",
                        env.status === "sleeping" && "opacity-70"
                      )}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", cfg.color)}>
                            <TierIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{env.name}</p>
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", cfg.color)}>
                              {t(`environments.tier.${env.tier}`)}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={env.status === "active" ? "running" : env.status === "sleeping" ? "paused" : env.status === "building" ? "building" : "failed"} />
                      </div>

                      {/* URL */}
                      {env.url && (
                        <a
                          href={env.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-violet-300 hover:text-violet-200 mb-3 truncate"
                        >
                          <Globe className="w-3 h-3 shrink-0" />
                          <span className="truncate">{env.url.replace("https://", "")}</span>
                          <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                        </a>
                      )}

                      {/* Commit info */}
                      <div className="space-y-1 text-[11px] mb-3">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GitBranch className="w-3 h-3 shrink-0" />
                          <span className="truncate">{env.branch}</span>
                          <code className="text-violet-300 bg-violet-500/10 px-1 rounded text-[10px]">{env.commitSha}</code>
                        </div>
                        <p className="text-xs truncate">{env.commitMessage}</p>
                        <p className="text-[10px] text-muted-foreground/70" suppressHydrationWarning>
                          {t("environments.lastDeploy")}: {timeAgo(env.lastDeployAt, locale)}
                        </p>
                      </div>

                      {/* Resources */}
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="p-2 rounded-lg bg-white/5 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase">
                            <Cpu className="w-2.5 h-2.5" />
                          </div>
                          <div className="text-xs font-semibold tabular-nums mt-0.5">{env.resources.cpuCores}</div>
                          <div className="text-[9px] text-muted-foreground">cores</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase">
                            <MemoryStick className="w-2.5 h-2.5" />
                          </div>
                          <div className="text-xs font-semibold tabular-nums mt-0.5">{env.resources.memoryMb}</div>
                          <div className="text-[9px] text-muted-foreground">MB</div>
                        </div>
                        <div className="p-2 rounded-lg bg-white/5 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground uppercase">
                            <Layers className="w-2.5 h-2.5" />
                          </div>
                          <div className="text-xs font-semibold tabular-nums mt-0.5">{env.replicas}x</div>
                          <div className="text-[9px] text-muted-foreground">{env.autoScale ? "auto" : "fixed"}</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {env.tier !== "production" && (
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                            <ArrowUpCircle className="w-3 h-3" />
                            {t("environments.promote")}
                          </Button>
                        )}
                        {env.status === "active" ? (
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                            <Moon className="w-3 h-3" />
                            {t("environments.sleep")}
                          </Button>
                        ) : env.status === "sleeping" ? (
                          <Button variant="outline" size="sm" className="flex-1 text-xs h-7">
                            <Sun className="w-3 h-3" />
                            {t("environments.wake")}
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400 hover:bg-rose-500/10">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <EmptyState
          icon={<Layers className="w-12 h-12" />}
          title={t("common.noData")}
        />
      )}
    </div>
  );
}
