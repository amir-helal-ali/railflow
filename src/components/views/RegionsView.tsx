"use client";

import * as React from "react";
import {
  Globe,
  Zap,
  Plus,
  Trash2,
  Cpu,
  MemoryStick,
  HardDrive,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockRegions, mockProjects, mockEdgeConfigs } from "@/lib/mock-data";
import { SectionHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Region } from "@/lib/types";

const statusConfig: Record<Region["status"], { color: string; label: string }> = {
  active: { color: "bg-emerald-400", label: "regions.status.active" },
  maintenance: { color: "bg-amber-400", label: "regions.status.maintenance" },
  planned: { color: "bg-zinc-500", label: "regions.status.planned" },
};

export function RegionsView() {
  const { t, locale: _locale } = useI18n();
  const { navigate: _navigate } = useRouter();
  const [selectedProjectId, setSelectedProjectId] = React.useState(mockProjects[0].id);
  const [edgeConfig, setEdgeConfig] = React.useState(mockEdgeConfigs[0]);

  React.useEffect(() => {
    const cfg = mockEdgeConfigs.find((c) => c.projectId === selectedProjectId);
    if (cfg) setEdgeConfig(cfg);
  }, [selectedProjectId]);

  const toggleReplica = (regionId: string) => {
    setEdgeConfig((c) => {
      const has = c.replicaRegions.includes(regionId);
      return {
        ...c,
        replicaRegions: has ? c.replicaRegions.filter((r) => r !== regionId) : [...c.replicaRegions, regionId],
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Globe className="w-6 h-6 text-violet-300" />
          {t("regions.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("regions.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Regions map/list */}
        <div className="lg:col-span-2 glass-card p-5">
          <SectionHeader title={t("regions.title")} subtitle={`${mockRegions.filter((r) => r.status === "active").length} active regions`} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mockRegions.map((r) => {
              const cfg = statusConfig[r.status];
              const isPrimary = edgeConfig.primaryRegion === r.id;
              const isReplica = edgeConfig.replicaRegions.includes(r.id);
              const isAvailable = r.status === "active";
              return (
                <div
                  key={r.id}
                  className={cn(
                    "p-4 rounded-xl border transition-all",
                    isPrimary ? "border-violet-400 bg-violet-500/10" : isReplica ? "border-cyan-400/40 bg-cyan-500/5" : "border-white/10 bg-white/5",
                    !isAvailable && "opacity-50"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{r.flag}</span>
                      <div>
                        <p className="text-sm font-semibold">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.code} · {r.country}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="flex items-center gap-1 text-[10px]">
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.color)} />
                        {t(cfg.label)}
                      </span>
                      <span className="text-[10px] text-muted-foreground tabular-nums">{r.latencyMs}ms</span>
                    </div>
                  </div>

                  {/* Resources */}
                  {isAvailable && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center p-1.5 rounded bg-white/5">
                        <Cpu className="w-3 h-3 mx-auto text-muted-foreground" />
                        <div className="text-[10px] font-mono tabular-nums mt-0.5">{r.resources.cpuAvailable}</div>
                      </div>
                      <div className="text-center p-1.5 rounded bg-white/5">
                        <MemoryStick className="w-3 h-3 mx-auto text-muted-foreground" />
                        <div className="text-[10px] font-mono tabular-nums mt-0.5">{r.resources.memoryAvailableGb}GB</div>
                      </div>
                      <div className="text-center p-1.5 rounded bg-white/5">
                        <HardDrive className="w-3 h-3 mx-auto text-muted-foreground" />
                        <div className="text-[10px] font-mono tabular-nums mt-0.5">{r.resources.storageAvailableGb}GB</div>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isPrimary && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
                        ★ {t("regions.primary")}
                      </span>
                    )}
                    {isReplica && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        ↻ {t("regions.replicas")}
                      </span>
                    )}
                    {r.projects > 0 && (
                      <span className="text-[10px] text-muted-foreground">{r.projects} projects</span>
                    )}
                  </div>

                  {/* Actions */}
                  {isAvailable && !isPrimary && (
                    <div className="flex gap-1 mt-3">
                      <Button variant="outline" size="sm" className="flex-1 h-7 text-xs" onClick={() => setEdgeConfig({ ...edgeConfig, primaryRegion: r.id })}>
                        {t("regions.setPrimary")}
                      </Button>
                      <Button
                        variant={isReplica ? "outline" : "default"}
                        size="sm"
                        className={cn("flex-1 h-7 text-xs", !isReplica && "bg-gradient-to-r from-cyan-500 to-violet-500 border-0")}
                        onClick={() => toggleReplica(r.id)}
                      >
                        {isReplica ? t("common.cancel") : t("regions.addReplica")}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Edge config */}
        <div className="space-y-4">
          {/* Project picker */}
          <div className="glass-card p-3">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full h-9 px-3 rounded-lg bg-white/5 border border-white/10 text-sm"
            >
              {mockProjects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Edge toggles */}
          <div className="glass-card p-5">
            <SectionHeader title={t("regions.title")} />
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-violet-300" />
                  <div>
                    <p className="text-sm font-medium">{t("regions.edgeCache")}</p>
                    <p className="text-[10px] text-muted-foreground">Cache static assets at edge locations</p>
                  </div>
                </div>
                <Switch
                  checked={edgeConfig.edgeCache}
                  onCheckedChange={(v) => setEdgeConfig({ ...edgeConfig, edgeCache: v })}
                />
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-300" />
                  <div>
                    <p className="text-sm font-medium">{t("regions.cdn")}</p>
                    <p className="text-[10px] text-muted-foreground">Global CDN distribution</p>
                  </div>
                </div>
                <Switch
                  checked={edgeConfig.cdnEnabled}
                  onCheckedChange={(v) => setEdgeConfig({ ...edgeConfig, cdnEnabled: v })}
                />
              </div>
            </div>
          </div>

          {/* Custom rules */}
          <div className="glass-card p-5">
            <SectionHeader
              title={t("regions.customRules")}
              action={
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3" />
                  {t("regions.addRule")}
                </Button>
              }
            />
            <div className="space-y-2">
              {edgeConfig.customRules.length === 0 ? (
                <p className="text-xs text-muted-foreground/50 text-center py-4">No custom rules</p>
              ) : (
                edgeConfig.customRules.map((rule) => (
                  <div key={rule.id} className="p-2.5 rounded-lg bg-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-xs font-mono text-violet-300 flex-1 truncate">{rule.pattern}</code>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded border",
                        rule.action === "cache" ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" :
                        rule.action === "redirect" ? "bg-amber-500/10 text-amber-300 border-amber-500/20" :
                        rule.action === "rewrite" ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" :
                        "bg-rose-500/10 text-rose-300 border-rose-500/20"
                      )}>
                        {t(`regions.rule.action.${rule.action}`)}
                      </span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-400">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    {rule.value && <code className="text-[10px] font-mono text-muted-foreground">→ {rule.value}</code>}
                    {rule.ttl && <span className="text-[10px] text-muted-foreground ms-2">TTL: {rule.ttl}s</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
