"use client";

import * as React from "react";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Bug,
  Lock,
  Key,
  AlertTriangle,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Activity,
  Server,
  Settings2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockSecurityFindings, mockSecurityScans, mockFirewallRules } from "@/lib/mock-data";
import { SectionHeader } from "@/components/dashboard/shared";
import { RadialGauge } from "@/components/charts";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SecurityFinding } from "@/lib/types";

const severityConfig: Record<SecurityFinding["severity"], { color: string; bg: string; border: string }> = {
  critical: { color: "text-rose-400", bg: "bg-rose-500/5", border: "border-rose-500/20" },
  high: { color: "text-amber-300", bg: "bg-amber-500/5", border: "border-amber-500/20" },
  medium: { color: "text-yellow-300", bg: "bg-yellow-500/5", border: "border-yellow-500/20" },
  low: { color: "text-sky-300", bg: "bg-sky-500/5", border: "border-sky-500/20" },
};

const statusConfig: Record<SecurityFinding["status"], { color: string; label: string }> = {
  open: { color: "text-rose-400", label: "security.status.open" },
  acknowledged: { color: "text-amber-300", label: "security.status.acknowledged" },
  resolved: { color: "text-emerald-400", label: "security.status.resolved" },
  ignored: { color: "text-muted-foreground", label: "security.status.ignored" },
};

const categoryIcon: Record<SecurityFinding["category"], React.ElementType> = {
  vulnerability: Bug,
  misconfiguration: Settings2,
  "exposed-secret": Key,
  "outdated-dependency": AlertTriangle,
  "weak-auth": Lock,
  "open-port": Server,
};

export function SecurityView() {
  const { t, locale } = useI18n();
  const [findings, setFindings] = React.useState(mockSecurityFindings);
  const [filter, setFilter] = React.useState<"all" | SecurityFinding["severity"]>("all");
  const [selectedFinding, setSelectedFinding] = React.useState<SecurityFinding | null>(null);

  const updateStatus = (id: string, status: SecurityFinding["status"]) => {
    setFindings((f) => f.map((x) => (x.id === id ? { ...x, status } : x)));
    setSelectedFinding(null);
  };

  const filtered = findings.filter((f) => filter === "all" || f.severity === filter);
  const openCount = findings.filter((f) => f.status === "open").length;
  const criticalCount = findings.filter((f) => f.severity === "critical" && f.status === "open").length;
  const securityScore = Math.max(0, 100 - criticalCount * 20 - findings.filter(f => f.severity === "high" && f.status === "open").length * 10 - findings.filter(f => f.severity === "medium" && f.status === "open").length * 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-violet-300" />
            {t("security.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("security.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Play className="w-4 h-4" />
          {t("security.runScan")}
        </Button>
      </div>

      {/* Top: security score + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 flex flex-col items-center justify-center">
          <RadialGauge value={securityScore} label={t("security.score")} size={140} color={securityScore > 80 ? "oklch(0.75 0.2 145)" : securityScore > 60 ? "oklch(0.78 0.18 75)" : "oklch(0.7 0.24 25)"} />
          <p className="text-xs text-muted-foreground mt-3">{openCount} open findings</p>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-rose-400">{findings.filter(f => f.severity === "critical" && f.status === "open").length}</div>
            <div className="text-xs text-muted-foreground">{t("security.severity.critical")}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-amber-300">{findings.filter(f => f.severity === "high" && f.status === "open").length}</div>
            <div className="text-xs text-muted-foreground">{t("security.severity.high")}</div>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-semibold tabular-nums text-emerald-400">{findings.filter(f => f.status === "resolved").length}</div>
            <div className="text-xs text-muted-foreground">{t("security.status.resolved")}</div>
          </div>
        </div>
      </div>

      {/* Findings */}
      <div className="glass-card p-5">
        <SectionHeader
          title={t("security.findings")}
          action={
            <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
              {(["all", "critical", "high", "medium", "low"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-2.5 py-1 text-[10px] font-medium rounded transition-colors",
                    filter === f ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {f === "all" ? t("alerts.all") : t(`security.severity.${f}`)}
                </button>
              ))}
            </div>
          }
        />
        <div className="space-y-2">
          {filtered.map((finding) => {
            const cfg = severityConfig[finding.severity];
            const CatIcon = categoryIcon[finding.category];
            const statusCfg = statusConfig[finding.status];
            return (
              <div
                key={finding.id}
                className={cn("p-3 rounded-lg border", cfg.bg, cfg.border, "cursor-pointer hover:bg-white/[0.07] transition-colors")}
                onClick={() => setSelectedFinding(finding)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg, cfg.border, "border")}>
                    <CatIcon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium">{finding.title}</h3>
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", cfg.color, cfg.border)}>
                        {t(`security.severity.${finding.severity}`)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{t(`security.category.${finding.category}`)}</span>
                      {finding.cvssScore && (
                        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5", cfg.color)}>
                          CVSS {finding.cvssScore}
                        </span>
                      )}
                      <span className={cn("text-[10px] px-1.5 py-0.5 rounded", statusCfg.color, "bg-white/5")}>
                        {t(statusCfg.label)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{finding.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground/70">
                      <span>{finding.resource.type}: {finding.resource.name}</span>
                      <span suppressHydrationWarning>· {timeAgo(finding.detectedAt, locale)}</span>
                      {finding.cve && <code className="font-mono text-violet-300">{finding.cve}</code>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent scans */}
        <div className="glass-card p-5">
          <SectionHeader title={t("security.scans")} />
          <div className="space-y-2">
            {mockSecurityScans.map((scan) => (
              <div key={scan.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", scan.status === "running" ? "bg-violet-500/10" : "bg-white/5")}>
                  {scan.status === "running" ? (
                    <Activity className="w-4 h-4 text-violet-300 animate-pulse" />
                  ) : scan.status === "completed" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{t(`security.scan.type.${scan.type}`)}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{scan.target}</p>
                </div>
                <div className="text-end shrink-0">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    {scan.findingsCount.critical > 0 && <span className="text-rose-400 tabular-nums">{scan.findingsCount.critical}C</span>}
                    {scan.findingsCount.high > 0 && <span className="text-amber-300 tabular-nums">{scan.findingsCount.high}H</span>}
                    {scan.findingsCount.medium > 0 && <span className="text-yellow-300 tabular-nums">{scan.findingsCount.medium}M</span>}
                    {scan.findingsCount.low > 0 && <span className="text-sky-300 tabular-nums">{scan.findingsCount.low}L</span>}
                    {scan.findingsCount.critical + scan.findingsCount.high + scan.findingsCount.medium + scan.findingsCount.low === 0 && scan.status === "completed" && (
                      <span className="text-emerald-400">Clean</span>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground" suppressHydrationWarning>{timeAgo(scan.startedAt, locale)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Firewall rules */}
        <div className="glass-card p-5">
          <SectionHeader
            title={t("security.firewall")}
            action={
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="w-3 h-3" />
                {t("security.addRule")}
              </Button>
            }
          />
          <div className="space-y-1 max-h-96 overflow-y-auto scrollbar-thin">
            {mockFirewallRules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-1 rounded shrink-0 w-12 text-center",
                  rule.action === "allow" ? "bg-emerald-500/10 text-emerald-300" : "bg-rose-500/10 text-rose-300"
                )}>
                  {rule.action === "allow" ? "ALLOW" : "DENY"}
                </span>
                <div className="flex-1 min-w-0">
                  <code className="text-[11px] font-mono text-violet-300 truncate block">{rule.source} → {rule.destination}:{rule.port}</code>
                  <p className="text-[10px] text-muted-foreground truncate">{rule.description}</p>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">P{rule.priority}</span>
                <Switch defaultChecked={rule.enabled} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Finding detail dialog */}
      {selectedFinding && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedFinding(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className={cn("text-[10px] px-2 py-1 rounded border", severityConfig[selectedFinding.severity].color, severityConfig[selectedFinding.severity].border)}>
                  {t(`security.severity.${selectedFinding.severity}`)}
                </span>
                {selectedFinding.cvssScore && (
                  <span className="text-xs font-mono px-2 py-1 rounded bg-white/5">
                    CVSS {selectedFinding.cvssScore}
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedFinding(null)} className="text-muted-foreground hover:text-foreground text-xl">×</button>
            </div>
            <h2 className="text-lg font-semibold mb-2">{selectedFinding.title}</h2>
            <p className="text-sm text-muted-foreground mb-4">{selectedFinding.description}</p>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("security.resource")}</span>
                <span>{selectedFinding.resource.name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t("security.category")}</span>
                <span>{t(`security.category.${selectedFinding.category}`)}</span>
              </div>
              {selectedFinding.cve && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{t("security.cve")}</span>
                  <code className="font-mono text-violet-300">{selectedFinding.cve}</code>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-white/5 mb-4">
              <p className="text-xs font-medium mb-1">{t("security.recommendation")}</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{selectedFinding.recommendation}</p>
            </div>
            <div className="flex gap-2">
              {selectedFinding.status !== "acknowledged" && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => updateStatus(selectedFinding.id, "acknowledged")}>
                  {t("security.acknowledge")}
                </Button>
              )}
              {selectedFinding.status !== "resolved" && (
                <Button variant="outline" size="sm" className="flex-1 border-emerald-500/30 text-emerald-300" onClick={() => updateStatus(selectedFinding.id, "resolved")}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("security.resolve")}
                </Button>
              )}
              {selectedFinding.status !== "ignored" && (
                <Button variant="outline" size="sm" className="flex-1" onClick={() => updateStatus(selectedFinding.id, "ignored")}>
                  {t("security.ignore")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
