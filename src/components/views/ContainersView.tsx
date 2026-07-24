"use client";

import * as React from "react";
import {
  Play,
  Square,
  RotateCcw,
  Terminal,
  Search,
  Activity,
  Cpu,
  MemoryStick,
  Network as NetworkIcon,
  HardDrive,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useRouter } from "@/lib/router";
import { mockContainers, mockDockerEvents } from "@/lib/mock-data";
import type { DockerEvent } from "@/lib/types";
import { StatusBadge, SectionHeader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { timeAgo, formatUptime, formatBytes, useInterval } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ContainersView() {
  const { t, locale } = useI18n();
  const { navigate } = useRouter();
  const [query, setQuery] = React.useState("");
  const [showStopped, setShowStopped] = React.useState(true);
  const [events, setEvents] = React.useState(mockDockerEvents);

  useInterval(() => {
    // Simulate new events
    if (Math.random() > 0.7) {
      const newEvent: DockerEvent = {
        id: `e_new_${Date.now()}`,
        type: "container",
        action: "health_status: healthy",
        actor: { id: `c_${Math.random().toString(36).slice(2, 6)}`, attributes: { name: "web-platform-prod" } },
        scope: "local",
        time: new Date().toISOString(),
        message: "Container health check passed",
      };
      setEvents((e) => [newEvent, ...e].slice(0, 50));
    }
  }, 6000);

  const filtered = mockContainers.filter((c) => {
    if (!showStopped && c.status !== "running") return false;
    if (query && !c.name.toLowerCase().includes(query.toLowerCase()) && !c.image.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("containers.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("containers.subtitle")}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("containers.search")}
            className="pl-9 bg-white/5 border-white/10"
          />
        </div>
        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs cursor-pointer">
          <Switch checked={showStopped} onCheckedChange={setShowStopped} />
          <span className="text-muted-foreground">{t("containers.showStopped")}</span>
        </label>
      </div>

      {/* Containers table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-xs text-muted-foreground uppercase tracking-wider">
                <th className="text-start font-medium px-4 py-3">{t("common.name")}</th>
                <th className="text-start font-medium px-4 py-3 hidden md:table-cell">{t("containers.image")}</th>
                <th className="text-start font-medium px-4 py-3">{t("common.status")}</th>
                <th className="text-end font-medium px-4 py-3">{t("containers.cpu")}</th>
                <th className="text-end font-medium px-4 py-3 hidden lg:table-cell">{t("containers.memory")}</th>
                <th className="text-end font-medium px-4 py-3 hidden lg:table-cell">{t("containers.netIO")}</th>
                <th className="text-end font-medium px-4 py-3 hidden xl:table-cell">{t("common.uptime")}</th>
                <th className="text-end font-medium px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-1 h-8 rounded-full",
                        c.status === "running" ? "bg-emerald-400" : c.status === "stopped" ? "bg-zinc-500" : "bg-amber-400"
                      )} />
                      <div className="min-w-0">
                        <button
                          onClick={() => c.projectId && navigate({ name: "project", projectId: c.projectId })}
                          className="font-medium text-sm truncate hover:text-violet-300 transition-colors text-start"
                        >
                          {c.name}
                        </button>
                        <code className="text-[10px] text-muted-foreground/70 block">{c.id.slice(0, 12)}</code>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <code className="text-xs text-muted-foreground font-mono">{c.image}</code>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-end">
                    <span className={cn(
                      "tabular-nums font-medium",
                      c.stats.cpuPercent > 60 ? "text-rose-400" : c.stats.cpuPercent > 30 ? "text-amber-400" : "text-foreground"
                    )}>
                      {c.stats.cpuPercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-end hidden lg:table-cell">
                    <div className="tabular-nums">
                      <span className="text-sm">{c.stats.memoryUsedMb.toFixed(0)} MB</span>
                      <span className="text-[10px] text-muted-foreground block">/ {formatBytes(c.stats.memoryLimitMb)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end hidden lg:table-cell">
                    <div className="tabular-nums text-xs">
                      <div className="flex items-center justify-end gap-1 text-emerald-400">
                        <span>↓</span>{formatBytes(c.stats.netInMb)}
                      </div>
                      <div className="flex items-center justify-end gap-1 text-violet-300">
                        <span>↑</span>{formatBytes(c.stats.netOutMb)}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end hidden xl:table-cell">
                    <span className="tabular-nums text-xs text-muted-foreground">{formatUptime(c.uptime, locale)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {c.status === "running" ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Exec">
                            <Terminal className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" title="Restart">
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-rose-400" title="Stop">
                            <Square className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" title="Start">
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Docker Events stream */}
      <div className="glass-card p-5">
        <SectionHeader
          title={t("containers.events")}
          subtitle={t("containers.events.live")}
          action={
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="relative inline-flex">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="absolute inset-0 rounded-full animate-ping opacity-60 bg-emerald-400" />
              </span>
              {t("common.live")}
            </div>
          }
        />
        <div className="terminal rounded-lg p-4 max-h-80 overflow-y-auto scrollbar-thin text-xs space-y-1">
          {events.map((e) => {
            const isError = e.action.includes("unhealthy") || e.action.includes("die") || e.action.includes("stop");
            return (
              <div key={e.id} className="flex items-start gap-3 py-0.5">
                <span className="text-muted-foreground/60 shrink-0 tabular-nums">
                  {new Date(e.time).toLocaleTimeString("en-GB", { hour12: false })}
                </span>
                <span className={cn(
                  "shrink-0 font-semibold uppercase w-20",
                  isError ? "text-rose-300" : "text-emerald-300"
                )}>
                  {e.action}
                </span>
                <span className="text-muted-foreground/70 shrink-0">[{e.type}]</span>
                <span className="flex-1 break-all">{e.message}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
