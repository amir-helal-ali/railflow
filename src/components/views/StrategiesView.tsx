"use client";

import * as React from "react";
import {
  Save,
  GitBranch,
  Activity,
  Shield,
  RefreshCw,
  Layers,
  Split,
  Timer,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockProjects, mockDeployStrategies } from "@/lib/mock-data";
import { SectionHeader, StatusBadge } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { DeployStrategy } from "@/lib/types";

const strategyMeta: Record<DeployStrategy, { icon: React.ElementType; color: string }> = {
  rolling: { icon: RefreshCw, color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  "blue-green": { icon: Split, color: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  canary: { icon: TrendingUp, color: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
};

export function StrategiesView() {
  const { t } = useI18n();
  const { navigate } = useRouter();
  const [selectedProjectId, setSelectedProjectId] = React.useState(mockProjects[0].id);
  const [strategy, setStrategy] = React.useState<DeployStrategy>(mockDeployStrategies[0]?.strategy ?? "rolling");
  const [config, setConfig] = React.useState(mockDeployStrategies[0] ?? mockDeployStrategies[0]);

  React.useEffect(() => {
    const projConfig = mockDeployStrategies.find((s) => s.projectId === selectedProjectId);
    if (projConfig) {
      setStrategy(projConfig.strategy);
      setConfig(projConfig);
    }
  }, [selectedProjectId]);

  const project = mockProjects.find((p) => p.id === selectedProjectId);

  const update = <K extends keyof typeof config>(key: K, value: (typeof config)[K]) => {
    setConfig({ ...config, [key]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="w-6 h-6 text-violet-300" />
          {t("strategies.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("strategies.subtitle")}</p>
      </div>

      {/* Project picker */}
      <div className="glass-card p-3">
        <div className="flex items-center gap-2 flex-wrap">
          {mockProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                selectedProjectId === p.id
                  ? "bg-white/10 text-foreground border border-violet-400/40"
                  : "bg-white/5 text-muted-foreground hover:text-foreground border border-transparent"
              )}
            >
              <GitBranch className="w-3 h-3" />
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Strategy picker */}
        <div className="lg:col-span-3 glass-card p-5">
          <SectionHeader title={t("strategies.title")} subtitle={project?.name} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(["rolling", "blue-green", "canary"] as DeployStrategy[]).map((s) => {
              const meta = strategyMeta[s];
              const Icon = meta.icon;
              return (
                <button
                  key={s}
                  onClick={() => {
                    setStrategy(s);
                    update("strategy", s);
                  }}
                  className={cn(
                    "p-4 rounded-xl border text-start transition-all",
                    strategy === s ? "border-violet-400 bg-violet-500/10" : "border-white/10 bg-white/5 hover:border-white/20"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center border", meta.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">{t(`strategies.${s}`)}</span>
                    {strategy === s && <span className="text-[10px] text-violet-300 ms-auto">●</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{t(`strategies.${s}.desc`)}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Configuration form */}
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title={t("strategies.healthCheck")} />

          <div className="space-y-4">
            {/* Health check path */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                <Activity className="w-3 h-3" />
                {t("strategies.healthCheckPath")}
              </label>
              <Input
                value={config.healthCheckPath}
                onChange={(e) => update("healthCheckPath", e.target.value)}
                className="bg-white/5 border-white/10 font-mono text-sm"
                placeholder="/health"
              />
            </div>

            {/* Timeout + Interval */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Timer className="w-3 h-3" />
                  {t("strategies.timeout")}
                </label>
                <Input
                  type="number"
                  value={config.healthCheckTimeout}
                  onChange={(e) => update("healthCheckTimeout", Number(e.target.value))}
                  className="bg-white/5 border-white/10 tabular-nums"
                  min={5}
                  max={300}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3" />
                  {t("strategies.interval")}
                </label>
                <Input
                  type="number"
                  value={config.healthCheckInterval}
                  onChange={(e) => update("healthCheckInterval", Number(e.target.value))}
                  className="bg-white/5 border-white/10 tabular-nums"
                  min={1}
                  max={60}
                />
              </div>
            </div>

            {/* Blue/Green specific */}
            {strategy === "blue-green" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                  <Split className="w-3 h-3" />
                  {t("strategies.switchAfter")}
                </label>
                <Input
                  type="number"
                  value={config.switchAfterHealthySeconds ?? 60}
                  onChange={(e) => update("switchAfterHealthySeconds", Number(e.target.value))}
                  className="bg-white/5 border-white/10 tabular-nums"
                  min={10}
                  max={600}
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Wait this long after healthy before routing traffic to the new version.
                </p>
              </div>
            )}

            {/* Canary specific */}
            {strategy === "canary" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <TrendingUp className="w-3 h-3" />
                    {t("strategies.canaryPercent")}
                  </label>
                  <Input
                    type="number"
                    value={config.canaryPercent ?? 10}
                    onChange={(e) => update("canaryPercent", Number(e.target.value))}
                    className="bg-white/5 border-white/10 tabular-nums"
                    min={1}
                    max={100}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                    <Timer className="w-3 h-3" />
                    {t("strategies.canaryObserve")}
                  </label>
                  <Input
                    type="number"
                    value={config.canaryObserveMinutes ?? 15}
                    onChange={(e) => update("canaryObserveMinutes", Number(e.target.value))}
                    className="bg-white/5 border-white/10 tabular-nums"
                    min={1}
                    max={120}
                  />
                </div>
              </div>
            )}

            {/* Rollback */}
            <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    {t("strategies.rollbackOnError")}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Automatically revert to previous version if error rate exceeds threshold.</p>
                </div>
                <Switch checked={config.rollbackOnError} onCheckedChange={(v) => update("rollbackOnError", v)} />
              </div>
              {config.rollbackOnError && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    {t("strategies.rollbackThreshold")}
                  </label>
                  <Input
                    type="number"
                    value={config.rollbackThreshold}
                    onChange={(e) => update("rollbackThreshold", Number(e.target.value))}
                    className="bg-white/5 border-white/10 tabular-nums"
                    min={0}
                    max={100}
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
                <Save className="w-4 h-4" />
                {t("strategies.save")}
              </Button>
            </div>
          </div>
        </div>

        {/* Live preview */}
        <div className="glass-card p-5">
          <SectionHeader title={t("strategies.preview")} />
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Strategy</span>
              <span className={cn("px-2 py-0.5 rounded border text-[10px]", strategyMeta[strategy].color)}>
                {t(`strategies.${strategy}`)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Health path</span>
              <code className="text-violet-300 font-mono">{config.healthCheckPath}</code>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Timeout</span>
              <span className="tabular-nums">{config.healthCheckTimeout}s</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Interval</span>
              <span className="tabular-nums">{config.healthCheckInterval}s</span>
            </div>
            {strategy === "blue-green" && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Switch after</span>
                <span className="tabular-nums">{config.switchAfterHealthySeconds ?? 60}s healthy</span>
              </div>
            )}
            {strategy === "canary" && (
              <>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Canary traffic</span>
                  <span className="tabular-nums text-amber-300">{config.canaryPercent ?? 10}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Observe</span>
                  <span className="tabular-nums">{config.canaryObserveMinutes ?? 15}min</span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Auto-rollback</span>
              {config.rollbackOnError ? (
                <span className="text-rose-400">{t("common.yes")} ({config.rollbackThreshold}%)</span>
              ) : (
                <span className="text-muted-foreground/60">{t("common.no")}</span>
              )}
            </div>

            <div className="pt-3 border-t border-white/5">
              <p className="text-[10px] text-muted-foreground mb-2">Estimated deploy time:</p>
              <div className="text-2xl font-semibold tabular-nums gradient-text">
                {strategy === "rolling" ? "~90s" : strategy === "blue-green" ? "~120s" : "~180s"}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                {strategy === "rolling" ? "Stable, but brief overlap possible." : strategy === "blue-green" ? "Zero downtime." : "Progressive rollout."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
