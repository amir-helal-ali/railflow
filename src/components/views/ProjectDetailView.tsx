"use client";

import * as React from "react";
import {
  ArrowLeft,
  GitBranch,
  Globe,
  ExternalLink,
  Rocket,
  RotateCcw,
  AlertTriangle,
  Plus,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Download,
  Search,
  Circle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockProjects, mockDeployments, mockEnvVariables, generateLogs } from "@/lib/mock-data";
import { StatusBadge, SectionHeader, EmptyState, Sparkline } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { timeAgo, formatDuration, useInterval } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LogEntry, Deployment } from "@/lib/types";

export function ProjectDetailView({ projectId, tab: initialTab }: { projectId: string; tab?: string }) {
  const { t, locale: _locale } = useI18n();
  const { navigate } = useRouter();
  const project = mockProjects.find((p) => p.id === projectId);
  const [tab, setTab] = React.useState(initialTab || "overview");

  if (!project) {
    return (
      <EmptyState
        icon={<AlertTriangle className="w-12 h-12" />}
        title="Project not found"
        action={<Button onClick={() => navigate({ name: "projects" })}>{t("common.back")}</Button>}
      />
    );
  }

  const projectDeployments = mockDeployments.filter((d) => d.projectId === projectId);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & header */}
      <div className="space-y-4">
        <button
          onClick={() => navigate({ name: "projects" })}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3 h-3" />
          {t("nav.projects")}
        </button>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-cyan-400/20 border border-white/10 flex items-center justify-center shrink-0">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{project.description}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                  {project.repo}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {project.branch}
                </span>
                {project.domain && (
                  <a href={`https://${project.domain}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                    <Globe className="w-3 h-3" />
                    {project.domain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RotateCcw className="w-3.5 h-3.5" />
              {t("project.redeploy")}
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
              <Rocket className="w-3.5 h-3.5" />
              {t("common.deploy")}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white/5 border border-white/10 h-auto p-1 flex-wrap">
          <TabsTrigger value="overview" className="text-xs data-[state=active]:bg-white/10">{t("project.overview")}</TabsTrigger>
          <TabsTrigger value="deployments" className="text-xs data-[state=active]:bg-white/10">{t("project.deployments")}</TabsTrigger>
          <TabsTrigger value="configuration" className="text-xs data-[state=active]:bg-white/10">{t("project.configuration")}</TabsTrigger>
          <TabsTrigger value="env" className="text-xs data-[state=active]:bg-white/10">{t("project.environment")}</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs data-[state=active]:bg-white/10">{t("project.logs")}</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-white/10">{t("project.settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <OverviewTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="deployments" className="mt-4">
          <DeploymentsTab deployments={projectDeployments} />
        </TabsContent>
        <TabsContent value="configuration" className="mt-4">
          <ConfigurationTab projectId={projectId} />
        </TabsContent>
        <TabsContent value="env" className="mt-4">
          <EnvironmentTab />
        </TabsContent>
        <TabsContent value="logs" className="mt-4">
          <LogsTab projectName={project.name} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <SettingsTab projectName={project.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ projectId }: { projectId: string }) {
  const { t, locale } = useI18n();
  const project = mockProjects.find((p) => p.id === projectId)!;
  const deployments = mockDeployments.filter((d) => d.projectId === projectId);

  const spark = Array.from({ length: 30 }, () => Math.random() * 40 + 30);

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("projects.totalDeploys")}</div>
          <div className="text-2xl font-semibold tabular-nums">{project.stats.totalDeploys}</div>
          <div className="text-[11px] text-emerald-400 mt-1">+{project.stats.last24hDeploys} in 24h</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("projects.successRate")}</div>
          <div className="text-2xl font-semibold tabular-nums">{project.stats.successRate}%</div>
          <div className="mt-2"><Sparkline data={spark} color="oklch(0.75 0.2 145)" width={120} height={20} /></div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("projects.avgDeployTime")}</div>
          <div className="text-2xl font-semibold tabular-nums">{formatDuration(project.stats.avgDeploySeconds * 1000, locale)}</div>
          <div className="text-[11px] text-muted-foreground mt-1">last 30 days</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{t("project.health")}</div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.health} />
          </div>
          <div className="text-[11px] text-muted-foreground mt-1" suppressHydrationWarning>last check: {timeAgo(new Date(Date.now() - 60_000).toISOString(), locale)}</div>
        </div>
      </div>

      {/* Recent deployments + domains */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title={t("dashboard.recentDeployments")} />
          {deployments.length === 0 ? (
            <EmptyState title={t("common.noData")} />
          ) : (
            <div className="space-y-1">
              {deployments.slice(0, 5).map((d) => (
                <div key={d.id} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/5">
                  <img src={d.authorAvatar} alt="" className="w-7 h-7 rounded-full ring-1 ring-white/10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded">{d.commitSha}</code>
                      <span className="text-xs text-muted-foreground">{d.branch}</span>
                    </div>
                    <p className="text-xs truncate mt-0.5">{d.commitMessage}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={d.status} />
                    <span className="text-[10px] text-muted-foreground/70" suppressHydrationWarning>{timeAgo(d.startedAt, locale)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <SectionHeader title={t("project.domains")} />
          <div className="space-y-2">
            {project.customDomains.length > 0 ? project.customDomains.map((d) => (
              <div key={d} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-xs font-mono truncate">{d}</span>
                </div>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-emerald-400" />
                  live
                </span>
              </div>
            )) : <EmptyState title={t("common.noData")} />}
          </div>
        </div>
      </div>

      {/* Resources */}
      <div className="glass-card p-5">
        <SectionHeader title="Allocated Resources" />
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">CPU</div>
            <div className="text-lg font-semibold tabular-nums">{project.resources.cpuCores} cores</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Memory</div>
            <div className="text-lg font-semibold tabular-nums">{project.resources.memoryMb} MB</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Disk</div>
            <div className="text-lg font-semibold tabular-nums">{project.resources.diskMb} MB</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeploymentsTab({ deployments }: { deployments: Deployment[] }) {
  const { t, locale } = useI18n();
  const [selected, setSelected] = React.useState<Deployment | null>(deployments[0] || null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* List */}
      <div className="glass-card p-3 lg:col-span-1">
        <div className="space-y-1 max-h-[600px] overflow-y-auto scrollbar-thin">
          {deployments.map((d) => (
            <button
              key={d.id}
              onClick={() => setSelected(d)}
              className={cn(
                "flex items-start gap-2.5 w-full p-2.5 rounded-lg text-start transition-colors",
                selected?.id === d.id ? "bg-white/10" : "hover:bg-white/5"
              )}
            >
              <StatusBadge status={d.status} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <code className="text-[10px] text-violet-300 bg-violet-500/10 px-1 py-0.5 rounded">{d.commitSha}</code>
                  <span className="text-[10px] text-muted-foreground">{d.branch}</span>
                </div>
                <p className="text-xs truncate mt-1">{d.commitMessage}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-0.5" suppressHydrationWarning>{timeAgo(d.startedAt, locale)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail */}
      <div className="lg:col-span-2 glass-card p-5">
        {selected ? <DeploymentPipeline deployment={selected} /> : <EmptyState title={t("common.noData")} />}
      </div>
    </div>
  );
}

function DeploymentPipeline({ deployment }: { deployment: Deployment }) {
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
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <code className="text-sm text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded">{deployment.commitSha}</code>
            <StatusBadge status={deployment.status} />
          </div>
          <p className="text-sm">{deployment.commitMessage}</p>
          <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
            {deployment.author} · {deployment.branch} · {timeAgo(deployment.startedAt, locale)}
            {deployment.durationMs && ` · ${formatDuration(deployment.durationMs, locale)}`}
          </p>
        </div>
        {deployment.url && (
          <a href={deployment.url} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <ExternalLink className="w-3 h-3" />
              Visit
            </Button>
          </a>
        )}
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
          {deployment.stages.map((stage, i) => {
            const label = stageLabels[stage.id] || stage.id;
            return (
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
                  {stage.status === "running" && <Circle className="w-2 h-2 fill-violet-300 animate-pulse" />}
                  {(stage.status === "pending" || stage.status === "skipped") && i + 1}
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span className={cn(
                    "text-sm",
                    stage.status === "pending" || stage.status === "skipped" ? "text-muted-foreground/60" : "text-foreground"
                  )}>
                    {label}
                  </span>
                  {stage.status === "running" && (
                    <span className="text-[10px] text-violet-300 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-violet-300 animate-pulse" />
                      running…
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConfigurationTab({ projectId }: { projectId: string }) {
  const { t } = useI18n();
  const project = mockProjects.find((p) => p.id === projectId)!;

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <SectionHeader title={t("project.buildSettings")} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.runtime")}</label>
            <Input defaultValue={project.runtime} className="bg-white/5 border-white/10 font-mono text-sm" readOnly />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.rootDir")}</label>
            <Input defaultValue={project.rootDir} className="bg-white/5 border-white/10 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.installCommand")}</label>
            <Input defaultValue={project.installCommand} className="bg-white/5 border-white/10 font-mono text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.buildCommand")}</label>
            <Input defaultValue={project.buildCommand} className="bg-white/5 border-white/10 font-mono text-sm" />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("project.startCommand")}</label>
            <Input defaultValue={project.startCommand} className="bg-white/5 border-white/10 font-mono text-sm" />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <SectionHeader title="Deployment Settings" />
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div>
            <p className="text-sm font-medium">{t("project.autoDeploy")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("project.autoDeploy.desc")}</p>
          </div>
          <Switch defaultChecked={project.autoDeploy} />
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
          <div>
            <p className="text-sm font-medium">{t("project.previewDeploy")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("project.previewDeploy.desc")}</p>
          </div>
          <Switch defaultChecked={project.previewDeploy} />
        </div>
        <div className="flex justify-end">
          <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">{t("common.save")}</Button>
        </div>
      </div>
    </div>
  );
}

function EnvironmentTab() {
  const { t } = useI18n();
  const [vars, _setVars] = React.useState(mockEnvVariables);
  const [revealed, setRevealed] = React.useState<Set<string>>(new Set());
  const [copied, setCopied] = React.useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealed((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const copy = (id: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="glass-card p-5">
      <SectionHeader
        title={t("project.environment")}
        action={
          <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
            <Plus className="w-3.5 h-3.5" />
            {t("project.addVariable")}
          </Button>
        }
      />
      <div className="space-y-1.5">
        {vars.map((v) => (
          <div key={v.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/[0.07] group">
            <code className="text-sm font-mono text-violet-300 min-w-[180px]">{v.key}</code>
            <div className="flex-1 min-w-0">
              <code className="text-xs font-mono text-muted-foreground truncate block">
                {v.isSensitive && !revealed.has(v.id) ? "••••••••••••••••••••••••" : v.value}
              </code>
            </div>
            <div className="flex items-center gap-1">
              {v.isSensitive && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleReveal(v.id)}>
                  {revealed.has(v.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copy(v.id, v.value)}>
                <Copy className="w-3.5 h-3.5" />
                {copied === v.id && <span className="text-[10px] text-emerald-400 absolute">{t("common.copied")}</span>}
              </Button>
              {v.isSecret && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">{t("project.secret")}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTab({ projectName }: { projectName: string }) {
  const { t } = useI18n();
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  React.useEffect(() => { setLogs(generateLogs(50)); }, []);
  const [filter, setFilter] = React.useState("");
  const [autoScroll, setAutoScroll] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useInterval(() => {
    const newLog = generateLogs(1)[0];
    setLogs((l) => [newLog, ...l].slice(0, 500));
  }, 4000);

  React.useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const filtered = logs.filter((l) =>
    !filter ||
    l.message.toLowerCase().includes(filter.toLowerCase()) ||
    l.source.toLowerCase().includes(filter.toLowerCase())
  );

  const levelColor: Record<LogEntry["level"], string> = {
    info: "text-sky-300",
    warn: "text-amber-300",
    error: "text-rose-300",
    debug: "text-muted-foreground",
    success: "text-emerald-300",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={t("project.logs.search")}
            className="pl-9 bg-white/5 border-white/10 font-mono text-sm"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setLogs([])}>
          {t("project.logs.clear")}
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-3.5 h-3.5" />
          {t("project.logs.download")}
        </Button>
      </div>

      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="relative inline-flex">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-400" />
          </span>
          {t("project.logs.live")} · {projectName}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
          <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
          Auto-scroll
        </label>
      </div>

      <div ref={containerRef} className="terminal rounded-lg p-4 max-h-[600px] overflow-y-auto scrollbar-thin text-xs leading-relaxed">
        {filtered.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">{t("common.noData")}</div>
        ) : (
          filtered.map((log) => (
            <div key={log.id} className="flex items-start gap-3 py-0.5 hover:bg-white/[0.02] -mx-2 px-2 rounded">
              <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
              </span>
              <span className={cn("shrink-0 font-semibold uppercase w-12", levelColor[log.level])}>
                {log.level}
              </span>
              <span className="text-muted-foreground/70 shrink-0">[{log.source}]</span>
              <span className="flex-1 break-all">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function SettingsTab({ projectName }: { projectName: string }) {
  const { t } = useI18n();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <SectionHeader title="General" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common.name")}</label>
            <Input defaultValue={projectName} className="bg-white/5 border-white/10" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("common.tags")}</label>
            <Input defaultValue="production, frontend" className="bg-white/5 border-white/10" />
          </div>
        </div>
      </div>

      <div className="glass-card p-5 border border-rose-500/20">
        <SectionHeader title={t("project.dangerZone")} />
        <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
          <div>
            <p className="text-sm font-medium text-rose-300">{t("project.delete.title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{t("project.delete.desc")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t("project.delete.confirm")}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <h3 className="text-lg font-semibold">{t("project.delete.title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">{t("project.delete.desc")}</p>
            <p className="text-xs text-muted-foreground mb-4">Type the project name to confirm:</p>
            <Input placeholder={projectName} className="bg-white/5 border-white/10 mb-4" />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setConfirmDelete(false)}>{t("common.cancel")}</Button>
              <Button variant="destructive">{t("project.delete.confirm")}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
