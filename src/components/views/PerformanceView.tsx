"use client";

import * as React from "react";
import {
  Gauge,
  TrendingUp,
  TrendingDown,
  Activity,
  Play,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockProjectPerformance } from "@/lib/mock-data";
import { SectionHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { LineTimeChart } from "@/components/charts";
import { cn } from "@/lib/utils";

function scoreColor(score: number): string {
  if (score >= 90) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-rose-400";
}

function scoreBg(score: number): string {
  if (score >= 90) return "bg-emerald-500/10 border-emerald-500/20";
  if (score >= 50) return "bg-amber-500/10 border-amber-500/20";
  return "bg-rose-500/10 border-rose-500/20";
}

function vitalStatus(value: number, thresholds: { good: number; poor: number }, lower = true): "good" | "needsImprovement" | "poor" {
  if (lower) {
    if (value <= thresholds.good) return "good";
    if (value <= thresholds.poor) return "needsImprovement";
    return "poor";
  }
  if (value >= thresholds.good) return "good";
  if (value >= thresholds.poor) return "needsImprovement";
  return "poor";
}

export function PerformanceView() {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = React.useState(mockProjectPerformance[0].projectId);
  const selected = mockProjectPerformance.find((p) => p.projectId === selectedId)!;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="w-6 h-6 text-violet-300" />
            {t("performance.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("performance.subtitle")}</p>
        </div>
        <Button className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0">
          <Play className="w-4 h-4" />
          {t("performance.runAudit")}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Project list */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="space-y-1 max-h-[640px] overflow-y-auto scrollbar-thin">
            {mockProjectPerformance.map((p) => (
              <button
                key={p.projectId}
                onClick={() => setSelectedId(p.projectId)}
                className={cn(
                  "flex items-center gap-2 w-full p-3 rounded-lg text-start transition-colors",
                  selectedId === p.projectId ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border", p.scores.performance > 0 ? scoreBg(p.scores.performance) : "bg-white/5 border-white/10")}>
                  <span className={cn("text-xs font-bold tabular-nums", p.scores.performance > 0 ? scoreColor(p.scores.performance) : "text-muted-foreground")}>
                    {p.scores.performance || "—"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.projectName}</p>
                  <code className="text-[10px] text-muted-foreground truncate block">{p.url.replace("https://", "")}</code>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div className="lg:col-span-3 space-y-4">
          {selected.scores.performance === 0 ? (
            <div className="glass-card p-12 text-center">
              <Activity className="w-12 h-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">This project is offline. No performance data available.</p>
            </div>
          ) : (
            <>
              {/* Lighthouse scores */}
              <div className="glass-card p-5">
                <SectionHeader title={t("performance.scores")} subtitle={selected.projectName} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { key: "performance", label: t("performance.score.performance"), value: selected.scores.performance },
                    { key: "accessibility", label: t("performance.score.accessibility"), value: selected.scores.accessibility },
                    { key: "bestPractices", label: t("performance.score.bestPractices"), value: selected.scores.bestPractices },
                    { key: "seo", label: t("performance.score.seo"), value: selected.scores.seo },
                  ] as const).map((s) => (
                    <div key={s.key} className={cn("p-4 rounded-xl border text-center", scoreBg(s.value))}>
                      <div className={cn("text-3xl font-bold tabular-nums", scoreColor(s.value))}>{s.value}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Core Web Vitals */}
              <div className="glass-card p-5">
                <SectionHeader title={t("performance.coreWebVitals")} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {([
                    { key: "lcp", label: t("performance.metric.lcp"), value: selected.coreWebVitals.lcp, unit: "s", thresholds: { good: 2.5, poor: 4.0 }, trend: selected.trends.lcp },
                    { key: "fid", label: t("performance.metric.fid"), value: selected.coreWebVitals.fid, unit: "s", thresholds: { good: 0.1, poor: 0.3 }, trend: selected.trends.fid },
                    { key: "cls", label: t("performance.metric.cls"), value: selected.coreWebVitals.cls, unit: "", thresholds: { good: 0.1, poor: 0.25 }, trend: selected.trends.cls },
                    { key: "inp", label: t("performance.metric.inp"), value: selected.coreWebVitals.inp, unit: "s", thresholds: { good: 0.2, poor: 0.5 }, trend: 0 },
                  ] as const).map((v) => {
                    const status = vitalStatus(v.value, v.thresholds);
                    const statusColor = status === "good" ? "text-emerald-400" : status === "needsImprovement" ? "text-amber-400" : "text-rose-400";
                    const statusBg = status === "good" ? "bg-emerald-500/5 border-emerald-500/20" : status === "needsImprovement" ? "bg-amber-500/5 border-amber-500/20" : "bg-rose-500/5 border-rose-500/20";
                    return (
                      <div key={v.key} className={cn("p-4 rounded-xl border", statusBg)}>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{v.label}</div>
                        <div className="text-2xl font-bold tabular-nums">
                          {v.value.toFixed(v.unit === "s" ? 2 : 3)}
                          <span className="text-sm text-muted-foreground ms-1">{v.unit}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className={cn("text-[10px] font-medium", statusColor)}>
                            {status === "good" ? t("performance.good") : status === "needsImprovement" ? t("performance.needsImprovement") : t("performance.poor")}
                          </span>
                          {v.trend !== 0 && (
                            <span className={cn("text-[10px] flex items-center gap-0.5", v.trend > 0 ? "text-rose-400" : "text-emerald-400")}>
                              {v.trend > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                              {Math.abs(v.trend)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* History chart */}
              <div className="glass-card p-5">
                <SectionHeader title={t("performance.history")} subtitle="LCP, FCP, TTFB (ms)" />
                {selected.history.length > 0 && (
                  <LineTimeChart
                    series={[
                      { name: "LCP", points: selected.history.map((h) => ({ timestamp: h.timestamp, value: h.lcpMs })), unit: "ms", color: "oklch(0.72 0.22 295)" },
                      { name: "FCP", points: selected.history.map((h) => ({ timestamp: h.timestamp, value: h.fcpMs })), unit: "ms", color: "oklch(0.78 0.17 190)" },
                      { name: "TTFB", points: selected.history.map((h) => ({ timestamp: h.timestamp, value: h.ttfbMs })), unit: "ms", color: "oklch(0.75 0.2 145)" },
                    ]}
                    height={220}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
