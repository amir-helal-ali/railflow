"use client";

import * as React from "react";
import {
  Search,
  Pause,
  Play,
  Trash2,
  Download,
  Plus,
  Activity,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mockContainers, mockLogStreams, generateAggregatedLogs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { AggregatedLog } from "@/lib/types";

const levelConfig: Record<AggregatedLog["level"], { color: string; bg: string; label: string }> = {
  info: { color: "text-sky-300", bg: "bg-sky-500/10", label: "INFO" },
  warn: { color: "text-amber-300", bg: "bg-amber-500/10", label: "WARN" },
  error: { color: "text-rose-400", bg: "bg-rose-500/10", label: "ERROR" },
  debug: { color: "text-muted-foreground", bg: "bg-white/5", label: "DEBUG" },
  success: { color: "text-emerald-300", bg: "bg-emerald-500/10", label: "OK" },
};

export function LogsAggView() {
  const { t, locale: _locale } = useI18n();
  const [logs, setLogs] = React.useState<AggregatedLog[]>(() => generateAggregatedLogs(80));
  const [filter, setFilter] = React.useState("");
  const [levelFilter, setLevelFilter] = React.useState<"all" | AggregatedLog["level"]>("all");
  const [selectedContainers, setSelectedContainers] = React.useState<Set<string>>(new Set(mockContainers.map((c) => c.id)));
  const [paused, setPaused] = React.useState(false);
  const [rate, setRate] = React.useState(0);
  const endRef = React.useRef<HTMLDivElement>(null);
  const msgCountRef = React.useRef(0);

  // Simulate live log streaming
  React.useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const newLogs = generateAggregatedLogs(2);
      setLogs((prev) => [...newLogs, ...prev].slice(0, 500));
      msgCountRef.current += newLogs.length;
      setRate(newLogs.length * (1000 / 3000)); // approximate msgs/sec
    }, 3000);
    return () => clearInterval(id);
  }, [paused]);

  const filtered = logs.filter((l) => {
    if (levelFilter !== "all" && l.level !== levelFilter) return false;
    if (!selectedContainers.has(l.containerId)) return false;
    if (filter && !l.message.toLowerCase().includes(filter.toLowerCase()) && !l.containerName.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const toggleContainer = (id: string) => {
    setSelectedContainers((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selectedContainers.size === mockContainers.length) {
      setSelectedContainers(new Set());
    } else {
      setSelectedContainers(new Set(mockContainers.map((c) => c.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-violet-300" />
            {t("logsAgg.title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t("logsAgg.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg glass-card text-xs">
            {paused ? (
              <>
                <Pause className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400">{t("logsAgg.paused")}</span>
              </>
            ) : (
              <>
                <span className="relative inline-flex">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-400" />
                </span>
                <span className="text-emerald-400">{t("logsAgg.live")}</span>
                <span className="text-muted-foreground tabular-nums">{rate.toFixed(1)} {t("logsAgg.rate")}</span>
              </>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {paused ? t("logsAgg.resume") : t("logsAgg.pause")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar: containers + saved streams */}
        <div className="lg:col-span-1 space-y-4">
          {/* Container filter */}
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("logsAgg.containers")}</span>
              <button onClick={toggleAll} className="text-[10px] text-violet-300 hover:text-violet-200">
                {selectedContainers.size === mockContainers.length ? t("logsAgg.deselectAll") : t("logsAgg.selectAll")}
              </button>
            </div>
            <div className="space-y-0.5 max-h-64 overflow-y-auto scrollbar-thin">
              {mockContainers.map((c) => (
                <label key={c.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-white/5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedContainers.has(c.id)}
                    onChange={() => toggleContainer(c.id)}
                    className="rounded"
                  />
                  <div className={cn("w-1.5 h-1.5 rounded-full", c.status === "running" ? "bg-emerald-400" : "bg-zinc-500")} />
                  <span className="text-xs font-mono truncate">{c.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div className="glass-card p-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">{t("logsAgg.level")}</span>
            <div className="flex flex-wrap gap-1">
              {(["all", "info", "warn", "error", "debug", "success"] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevelFilter(l)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded border transition-colors",
                    levelFilter === l ? "bg-white/10 text-foreground border-violet-400/40" : "bg-white/5 text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {l === "all" ? t("logsAgg.level.all") : levelConfig[l].label}
                </button>
              ))}
            </div>
          </div>

          {/* Saved streams */}
          <div className="glass-card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t("logsAgg.streams")}</span>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            <div className="space-y-1">
              {mockLogStreams.map((s) => (
                <button
                  key={s.id}
                  className="flex items-center gap-2 w-full p-2 rounded hover:bg-white/5 text-start transition-colors"
                >
                  <Switch checked={s.enabled} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{s.name}</p>
                    <code className="text-[10px] font-mono text-muted-foreground truncate block">{s.filter}</code>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Logs terminal */}
        <div className="lg:col-span-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("logsAgg.search")}
                className="pl-9 bg-white/5 border-white/10 font-mono text-sm"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setLogs([])}>
              <Trash2 className="w-3.5 h-3.5" />
              {t("logsAgg.clear")}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-3.5 h-3.5" />
              {t("logsAgg.export")}
            </Button>
          </div>

          {/* Terminal */}
          <div ref={endRef} className="terminal rounded-lg p-4 h-[640px] overflow-y-auto scrollbar-thin text-xs leading-relaxed">
            {filtered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground/40">
                <Activity className="w-12 h-12 mb-3" />
                <p className="text-sm">{t("logsAgg.noResults")}</p>
              </div>
            ) : (
              filtered.map((log) => {
                const cfg = levelConfig[log.level];
                return (
                  <div key={log.id} className="flex items-start gap-2 py-0.5 hover:bg-white/[0.02] -mx-2 px-2 rounded">
                    <span className="text-muted-foreground/60 shrink-0 tabular-nums w-20" suppressHydrationWarning>
                      {new Date(log.timestamp).toLocaleTimeString("en-GB", { hour12: false })}
                    </span>
                    <span className={cn("shrink-0 font-semibold w-12", cfg.color)}>{cfg.label}</span>
                    <code className="text-[10px] text-muted-foreground/70 shrink-0 w-32 truncate">{log.containerName}</code>
                    <span className="flex-1 break-all">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>

          {/* Stats bar */}
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground px-1">
            <span>{filtered.length} messages · {selectedContainers.size} containers</span>
            <span suppressHydrationWarning>Updated {new Date().toLocaleTimeString("en-GB", { hour12: false })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
