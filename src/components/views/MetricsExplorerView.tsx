"use client";

import * as React from "react";
import {
  Search,
  Play,
  Plus,
  Clock,
  RefreshCw,
  Activity,
  LineChart as LineChartIcon,
  BarChart3,
  Gauge as GaugeIcon,
  Hash,
  Database as DatabaseIcon,
  Server as ServerIcon,
  Container,
  Network as NetworkIcon,
  Code,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockMetricDefinitions, mockSavedDashboards, generateTimeSeries } from "@/lib/mock-data";
import { SectionHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AreaTimeChart, BarCountChart } from "@/components/charts";
import { cn } from "@/lib/utils";
import type { MetricDefinition } from "@/lib/types";

const sourceIcon: Record<MetricDefinition["source"], React.ElementType> = {
  container: Container,
  host: ServerIcon,
  application: Code,
  database: DatabaseIcon,
  network: NetworkIcon,
};

const sourceColor: Record<MetricDefinition["source"], string> = {
  container: "bg-cyan-500/10 text-cyan-300",
  host: "bg-violet-500/10 text-violet-300",
  application: "bg-emerald-500/10 text-emerald-300",
  database: "bg-amber-500/10 text-amber-300",
  network: "bg-pink-500/10 text-pink-300",
};

const typeIcon: Record<MetricDefinition["type"], React.ElementType> = {
  counter: Hash,
  gauge: GaugeIcon,
  histogram: BarChart3,
  summary: Activity,
};

export function MetricsExplorerView() {
  const { t } = useI18n();
  const [query, setQuery] = React.useState("");
  const [selectedMetric, setSelectedMetric] = React.useState<MetricDefinition | null>(mockMetricDefinitions[0]);
  const [timeRange, setTimeRange] = React.useState("1h");
  const [series, setSeries] = React.useState(() => generateTimeSeries(60, 45, 20, 60_000, "%"));

  React.useEffect(() => {
    setSeries(generateTimeSeries(60, 30 + Math.random() * 40, 20, 60_000, selectedMetric?.unit || ""));
  }, [selectedMetric, timeRange]);

  const filtered = mockMetricDefinitions.filter(
    (m) => !query || m.name.includes(query.toLowerCase()) || m.description.toLowerCase().includes(query.toLowerCase())
  );

  const timeRanges = ["5m", "1h", "6h", "24h", "7d", "30d"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-violet-300" />
          {t("metricsExplorer.title")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("metricsExplorer.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Metrics list */}
        <div className="lg:col-span-1 glass-card p-3">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("metricsExplorer.metrics")}
              className="pl-9 bg-white/5 border-white/10 h-9"
            />
          </div>
          <div className="space-y-0.5 max-h-[560px] overflow-y-auto scrollbar-thin">
            {filtered.map((m) => {
              const SrcIcon = sourceIcon[m.source];
              const TypeIcon = typeIcon[m.type];
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMetric(m)}
                  className={cn(
                    "flex items-start gap-2 w-full p-2 rounded-lg text-start transition-colors",
                    selectedMetric?.id === m.id ? "bg-white/10" : "hover:bg-white/5"
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", sourceColor[m.source])}>
                    <SrcIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <code className="text-[11px] font-mono text-violet-300 truncate block">{m.name}</code>
                    <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <TypeIcon className="w-2.5 h-2.5 text-muted-foreground" />
                      <span className="text-[9px] text-muted-foreground capitalize">{m.type}</span>
                      {m.unit && <span className="text-[9px] text-muted-foreground">· {m.unit}</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query + chart */}
        <div className="lg:col-span-3 space-y-4">
          {/* Query bar */}
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <code className="text-xs text-muted-foreground font-mono shrink-0">railflow_query</code>
              <Input
                value={selectedMetric ? selectedMetric.name : ""}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-black/30 border-white/10 font-mono text-sm h-9"
                placeholder="metric_name{label=value}"
              />
              <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10 shrink-0">
                {timeRanges.map((tr) => (
                  <button
                    key={tr}
                    onClick={() => setTimeRange(tr)}
                    className={cn(
                      "px-2 py-1 text-[10px] font-medium rounded transition-colors",
                      timeRange === tr ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tr}
                  </button>
                ))}
              </div>
              <Button size="sm" className="bg-gradient-to-r from-violet-500 to-cyan-500 border-0 h-9">
                <Play className="w-3.5 h-3.5" />
                {t("metricsExplorer.runQuery")}
              </Button>
            </div>
            {selectedMetric && (
              <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground">
                <span>{t("metricsExplorer.type")}: <span className="text-violet-300 capitalize">{selectedMetric.type}</span></span>
                <span>·</span>
                <span>{t("metricsExplorer.unit")}: <span className="text-cyan-300">{selectedMetric.unit || "—"}</span></span>
                <span>·</span>
                <span>{t("metricsExplorer.source")}: <span className={sourceColor[selectedMetric.source].split(" ")[1]} className="capitalize">{selectedMetric.source}</span></span>
                {selectedMetric.labels.length > 0 && (
                  <>
                    <span>·</span>
                    <span>{t("metricsExplorer.labels")}: {selectedMetric.labels.map((l) => (
                      <code key={l} className="text-amber-300 font-mono ms-1">{l}</code>
                    ))}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Chart */}
          {selectedMetric && (
            <div className="glass-card p-5">
              <SectionHeader
                title={selectedMetric.name}
                subtitle={selectedMetric.description}
                action={
                  <Button variant="ghost" size="sm" className="text-xs">
                    <RefreshCw className="w-3 h-3" />
                    {t("metricsExplorer.refresh")}
                  </Button>
                }
              />
              <AreaTimeChart
                series={[{ ...series, name: selectedMetric.name, color: "oklch(0.72 0.22 295)", unit: selectedMetric.unit || "" }]}
                height={280}
                unit={selectedMetric.unit || ""}
              />
            </div>
          )}

          {/* Saved dashboards */}
          <div className="glass-card p-5">
            <SectionHeader
              title={t("metricsExplorer.dashboards")}
              action={
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="w-3 h-3" />
                  {t("metricsExplorer.newDashboard")}
                </Button>
              }
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mockSavedDashboards.map((d) => (
                <div key={d.id} className="p-4 rounded-lg bg-white/5 hover:bg-white/[0.07] transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-2">
                    <LineChartIcon className="w-4 h-4 text-violet-300" />
                    <h3 className="text-sm font-medium truncate">{d.name}</h3>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">{d.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{d.panels.length} panels</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {d.updatedAt ? new Date(d.updatedAt).toLocaleDateString("en-GB") : "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
