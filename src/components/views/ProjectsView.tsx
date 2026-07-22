"use client";

import * as React from "react";
import {
  Plus,
  Search,
  GitBranch,
  ExternalLink,
  Globe,
  Clock,
  TrendingUp,
  Activity,
  Filter,
  Github,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockProjects } from "@/lib/mock-data";
import { StatusBadge, EmptyState, Sparkline } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { timeAgo, formatDuration } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Runtime } from "@/lib/types";

const runtimeColors: Record<Runtime, string> = {
  node: "bg-green-500/10 text-green-300 border-green-500/20",
  bun: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  deno: "bg-slate-500/10 text-slate-300 border-slate-500/20",
  python: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  go: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20",
  rust: "bg-orange-500/10 text-orange-300 border-orange-500/20",
  java: "bg-red-500/10 text-red-300 border-red-500/20",
  docker: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  static: "bg-violet-500/10 text-violet-300 border-violet-500/20",
};

export function ProjectsView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | "production" | "staging" | "failed">("all");
  const [showNewDialog, setShowNewDialog] = React.useState(false);

  const filtered = mockProjects.filter((p) => {
    if (query && !p.name.toLowerCase().includes(query.toLowerCase()) && !p.repo.toLowerCase().includes(query.toLowerCase())) return false;
    if (filter === "production" && !p.tags.includes("production")) return false;
    if (filter === "staging" && !p.tags.includes("staging")) return false;
    if (filter === "failed" && p.status !== "failed") return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("projects.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("projects.subtitle")}</p>
        </div>
        <Button
          onClick={() => setShowNewDialog(true)}
          className="bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 border-0 text-white"
        >
          <Plus className="w-4 h-4" />
          {t("projects.new")}
        </Button>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("projects.search")}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {(["all", "production", "staging", "failed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                filter === f ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? t("deployments.filter.all") : f}
            </button>
          ))}
        </div>
      </div>

      {/* Projects grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<GitBranch className="w-12 h-12" />}
          title={t("projects.empty.title")}
          description={t("projects.empty.desc")}
          action={<Button onClick={() => setShowNewDialog(true)}><Plus className="w-4 h-4" />{t("projects.importFromGithub")}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate({ name: "project", projectId: p.id })}
              className="group glass-card glass-card-hover p-5 text-start transition-all"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center shrink-0">
                    <Github className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-violet-300 transition-colors">{p.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{p.repo}</p>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 min-h-[2rem]">{p.description}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-lg bg-white/5 p-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("projects.totalDeploys")}</div>
                  <div className="text-sm font-semibold tabular-nums">{p.stats.totalDeploys}</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("projects.successRate")}</div>
                  <div className={cn("text-sm font-semibold tabular-nums", p.stats.successRate > 95 ? "text-emerald-400" : p.stats.successRate > 85 ? "text-amber-400" : "text-rose-400")}>
                    {p.stats.successRate}%
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 p-2">
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{t("projects.avgDeployTime")}</div>
                  <div className="text-sm font-semibold tabular-nums">{formatDuration(p.stats.avgDeploySeconds * 1000, locale)}</div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    {p.branch}
                  </span>
                  {p.domain && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3" />
                      {p.domain}
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70">
                  <Clock className="w-3 h-3" />
                  {p.lastDeployAt ? timeAgo(p.lastDeployAt, locale) : "—"}
                </span>
              </div>

              {/* Runtime badge */}
              <div className="absolute top-3 right-3">
                <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border", runtimeColors[p.runtime])}>
                  {p.runtime}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {showNewDialog && <NewProjectDialog onClose={() => setShowNewDialog(false)} />}
    </div>
  );
}

function NewProjectDialog({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const [repoUrl, setRepoUrl] = React.useState("");
  const [step, setStep] = React.useState<"connect" | "config" | "building">("connect");
  const [selectedRuntime, setSelectedRuntime] = React.useState<Runtime>("node");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl glass-card rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{t("projects.connectRepo")}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{t("projects.importFromGithub")}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl">×</button>
        </div>

        {/* Body */}
        <div className="p-6">
          {step === "connect" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">GitHub Repository URL</label>
                <Input
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/owner/repo"
                  className="bg-white/5 border-white/10 font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <Github className="w-5 h-5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">GitHub Connected</p>
                  <p className="text-xs text-muted-foreground">railflow-organization · 47 repositories</p>
                </div>
                <Button variant="ghost" size="sm">{t("common.disconnect")}</Button>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>{t("common.cancel")}</Button>
                <Button onClick={() => setStep("config")} disabled={!repoUrl}>
                  {t("common.continue")}
                </Button>
              </div>
            </div>
          )}

          {step === "config" && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">{t("project.runtime")}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["node", "bun", "python", "go", "rust", "docker"] as Runtime[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => setSelectedRuntime(r)}
                      className={cn(
                        "p-3 rounded-lg border text-sm font-medium transition-all",
                        selectedRuntime === r
                          ? "border-violet-400 bg-violet-500/10 text-violet-300"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common.branch")}</label>
                  <Input defaultValue="main" className="bg-white/5 border-white/10 font-mono text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.rootDir")}</label>
                  <Input defaultValue="./" className="bg-white/5 border-white/10 font-mono text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.buildCommand")}</label>
                <Input
                  defaultValue={selectedRuntime === "node" ? "npm run build" : selectedRuntime === "rust" ? "cargo build --release" : ""}
                  className="bg-white/5 border-white/10 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.startCommand")}</label>
                <Input
                  defaultValue={selectedRuntime === "node" ? "npm start" : selectedRuntime === "rust" ? "./app" : ""}
                  className="bg-white/5 border-white/10 font-mono text-sm"
                />
              </div>
              <div className="flex justify-between gap-2">
                <Button variant="ghost" onClick={() => setStep("connect")}>{t("common.back")}</Button>
                <Button
                  onClick={() => { setStep("building"); setTimeout(onClose, 2500); }}
                  className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0"
                >
                  <Plus className="w-4 h-4" />
                  {t("common.deploy")}
                </Button>
              </div>
            </div>
          )}

          {step === "building" && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-white/5" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-400 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Cloning repository & preparing build…</p>
                <p className="text-xs text-muted-foreground mt-1">This usually takes a few seconds</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
